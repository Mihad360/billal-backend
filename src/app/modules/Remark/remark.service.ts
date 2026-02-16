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

  // ✅ Handle file uploads to Cloudinary
  let imageUrls: string[] = [];
  if (files && files.length > 0) {
    try {
      // Upload all images to Cloudinary in parallel
      const uploadPromises = files.map((file) =>
        sendFileToCloudinary(file.buffer, file.originalname, file.mimetype),
      );

      const uploadResults = await Promise.all(uploadPromises);

      // Extract secure URLs from upload results
      imageUrls = uploadResults.map((result) => result.secure_url);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
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
    // ✅ Prepare history entry
    const historyEntry = {
      remarkedBy: isUserExist._id,
      userRole: isUserExist.role,
      description: description || "",
      images: imageUrls,
      remarkedAt: new Date(),
      statusAtTime: task.status,
    };

    // ✅ Find existing remark or create new one
    const existingRemark = await SiteTaskRemarkModel.findOne({
      taskId: taskId,
    }).session(session);

    let result;

    if (existingRemark) {
      // ✅ Update existing remark
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
        .populate("lastRemarkedBy", "name email avatar")
        .populate("history.remarkedBy", "name email avatar");

      result = updatedRemark;
    } else {
      // ✅ Create new remark (first time)
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
        .populate("lastRemarkedBy", "name email avatar")
        .populate("history.remarkedBy", "name email avatar");

      result = populatedRemark;
    }

    // ✅ Commit transaction
    await session.commitTransaction();
    await session.endSession();

    return result;
  } catch (error) {
    // ✅ Rollback transaction on error
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
};

// ✅ Get single remark by taskId
const getRemarkByTaskId = async (taskId: string) => {
  const remark = await SiteTaskRemarkModel.findOne({ taskId })
    .populate("lastRemarkedBy", "name email")
    .populate("history.remarkedBy", "name email")
    .populate("taskId", "title status")
    .populate("siteId", "name")
    .populate("fileId", "fileName");

  if (!remark) {
    throw new AppError(HttpStatus.NOT_FOUND, "No remark found for this task");
  }

  return remark;
};

export const remarkServices = {
  addRemark,
  getRemarkByTaskId,
};
