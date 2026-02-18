/* eslint-disable @typescript-eslint/no-explicit-any */
import HttpStatus from "http-status";
import { ISiteTaskRemark } from "./remark.interface";
import { SiteTaskRemarkModel } from "./remark.model";
import { sendFileToCloudinary } from "../../utils/sendImageToCloudinary";
import { SiteTaskModel } from "../SiteTask/task.model";
import AppError from "../../erros/AppError";
import { JwtPayload } from "../../interface/global";
import mongoose, { Types } from "mongoose";
import { UserModel } from "../User/user.model";

const addRemark = async (
  user: JwtPayload,
  taskId: string,
  payload: ISiteTaskRemark,
  files?: Express.Multer.File[],
) => {
  const userId = new Types.ObjectId(user.user);
  const { description } = payload;

  // ✅ Validation 1: At least description OR images must be provided
  if (!description && (!files || files.length === 0)) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Either description or images must be provided for a remark",
    );
  }

  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  // ✅ Validation 2: Check if task exists
  const task = await SiteTaskModel.findById(taskId);
  if (!task) {
    throw new AppError(HttpStatus.NOT_FOUND, "Task not found");
  }

  // ✅ Validation 3: Task must be in "Done" or "Remark" status to add remarks
  if (!["Done", "Remark"].includes(task.status)) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Can only add remarks to tasks with 'Done' or 'Remark' status",
    );
  }

  // ✅ Validation 4: Image count limit
  if (files && files.length > 5) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Maximum 5 images allowed per remark",
    );
  }

  // ✅ Validation 5: Office admin and worker can only remark once per task
  const restrictedRoles = ["office_admin", "worker"]; // 🔧 adjust role names to match your system
  if (restrictedRoles.includes(isUserExist.role)) {
    const existingRemark = await SiteTaskRemarkModel.findOne({ taskId });

    if (existingRemark) {
      const alreadyRemarked = existingRemark?.history?.some(
        (entry) => entry.remarkedBy.toString() === userId.toString(),
      );

      if (alreadyRemarked) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "You have already added a remark for this task. Only one remark is allowed.",
        );
      }
    }
  }

  // ✅ Handle file uploads to Cloudinary
  let imageUrls: string[] = [];
  if (files && files.length > 0) {
    try {
      const uploadPromises = files.map((file) =>
        sendFileToCloudinary(file.buffer, file.originalname, file.mimetype),
      );
      const uploadResults = await Promise.all(uploadPromises);
      imageUrls = uploadResults.map((result) => result.secure_url);
    } catch (error) {
      console.log(error);
      throw new AppError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "Failed to upload images to Cloudinary",
      );
    }
  }

  // ✅ Start MongoDB transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const historyEntry = {
      remarkedBy: isUserExist._id,
      userRole: isUserExist.role,
      description: description || "",
      images: imageUrls,
      remarkedAt: new Date(),
      statusAtTime: task.status,
    };

    const existingRemark = await SiteTaskRemarkModel.findOne({
      taskId,
    }).session(session);

    let result;

    if (existingRemark) {
      // ✅ Update top-level fields + push new history entry
      const updatedRemark = await SiteTaskRemarkModel.findOneAndUpdate(
        { taskId },
        {
          lastRemarkedBy: isUserExist._id,
          lastRemarkedRole: isUserExist.role,
          lastRemarkedAt: new Date(),
          description: description || existingRemark.description,
          images: imageUrls.length > 0 ? imageUrls : existingRemark.images,
          $push: {
            history: historyEntry,
          },
        },
        { new: true, runValidators: true, session },
      )
        .populate("lastRemarkedBy", "name email profileImage")
        .populate("history.remarkedBy", "name email profileImage");

      result = updatedRemark;
    } else {
      // ✅ Create new remark document for this task
      const [newRemark] = await SiteTaskRemarkModel.create(
        [
          {
            taskId,
            siteId: task.siteId,
            fileId: task.fileId,
            lastRemarkedBy: isUserExist._id,
            lastRemarkedRole: isUserExist.role,
            lastRemarkedAt: new Date(),
            description: description || "No description provided",
            images: imageUrls,
            history: [historyEntry],
          },
        ],
        { session },
      );

      const populatedRemark = await SiteTaskRemarkModel.findById(newRemark._id)
        .session(session)
        .populate("lastRemarkedBy", "name email profileImage")
        .populate("history.remarkedBy", "name email profileImage");

      result = populatedRemark;
    }

    await session.commitTransaction();
    await session.endSession();

    return result;
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
};

// ✅ Get single remark by taskId
const getRemarkByTaskId = async (taskId: string, user: JwtPayload) => {
  const userId = new Types.ObjectId(user.user);

  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  const remark = await SiteTaskRemarkModel.findOne({ taskId })
    .populate("history.remarkedBy", "name email profileImage")
    .populate("taskId", "title description status images");

  if (!remark) {
    throw new AppError(HttpStatus.NOT_FOUND, "No remark found for this task");
  }

  // ✅ Define role visibility rules (who sees whose remarks)
  const roleVisibilityMap: Record<string, string[]> = {
    worker: ["office_admin"], // worker sees office_admin remarks
    office_admin: ["worker"], // office_admin sees worker remarks
    // roles not listed here (e.g. super_admin, manager) see all history
  };

  const allowedRoles = roleVisibilityMap[isUserExist.role];

  // ✅ If the user's role has visibility restrictions, filter history
  if (allowedRoles) {
    const filteredHistory = remark?.history?.filter((entry) => {
      // entry.remarkedBy is populated, so access role from populated doc
      const remarkedByUser = entry.remarkedBy as any;
      return allowedRoles.includes(remarkedByUser?.role || entry.userRole);
    });

    // ✅ Return a plain object with filtered history instead of the mongoose doc
    return {
      ...remark.toObject(),
      history: filteredHistory,
    };
  }

  // ✅ Unrestricted roles see everything
  return remark;
};

export const remarkServices = {
  addRemark,
  getRemarkByTaskId,
};
