import HttpStatus from "http-status";
import { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { ISiteTask } from "./task.interface";
import { SiteTaskModel } from "./task.model";
import { UserModel } from "../User/user.model";
import { SiteFileModel } from "../SiteFile/sitefile.model";
import { SiteModel } from "../Site/site.model";
import AppError from "../../erros/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";
import { sendFileToCloudinary } from "../../utils/sendImageToCloudinary";

const assignTask = async (
  user: JwtPayload,
  fileId: string,
  payload: ISiteTask,
  files: Express.Multer.File[],
) => {
  const isUserExist = await UserModel.findById(user.user);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  // 1. Verify the file exists
  const file = await SiteFileModel.findById(fileId);
  if (!file) {
    throw new AppError(HttpStatus.NOT_FOUND, "File not found");
  }

  // 2. Verify the site exists
  const site = await SiteModel.findById(file.siteId);
  if (!site) {
    throw new AppError(HttpStatus.NOT_FOUND, "Site not found");
  }

  // 3. Verify the assigned worker exists
  const worker = await UserModel.findById(payload.assignedTo);
  if (!worker) {
    throw new AppError(HttpStatus.NOT_FOUND, "Assigned worker not found");
  }

  // 4. Upload attachments to Cloudinary if any files provided
  // 4. Upload attachments
  const imageUrls: string[] = [];
  let documentUrl: string | null = null;

  if (files && files.length > 0) {
    for (const item of files) {
      const uploadResult = await sendFileToCloudinary(
        item.buffer,
        `task-${Date.now()}-${item.originalname}`,
        item.mimetype,
      );

      // 🟢 If image
      if (item.mimetype.startsWith("image/")) {
        imageUrls.push(uploadResult.secure_url);
      }

      // 🔵 If PDF
      else if (item.mimetype === "application/pdf") {
        documentUrl = uploadResult.secure_url;
      }
    }
  }

  if (documentUrl) {
    await SiteFileModel.findByIdAndUpdate(fileId, {
      fileUrl: documentUrl,
    });
  }

  const taskData: Partial<ISiteTask> = {
    siteId: site._id,
    fileId: new Types.ObjectId(fileId),
    title: payload.title,
    description: payload.description,
    assignedTo: payload.assignedTo,
    assignedBy: new Types.ObjectId(user.user),
    assignedAt: new Date(),
    status: "To-Do",
    dueDate: payload.dueDate,
    images: imageUrls, // only images go here
  };

  const newTask = await SiteTaskModel.create(taskData);

  // 6. Populate references before returning
  await newTask.populate([
    { path: "assignedTo", select: "name email phone" },
    { path: "assignedBy", select: "name email" },
    { path: "siteId", select: "siteTitle location" },
    { path: "fileId", select: "fileName fileUrl fileType" },
  ]);

  return newTask;
};

const getMyTasks = async (user: JwtPayload, query: Record<string, unknown>) => {
  const userId = new Types.ObjectId(user.user);
  const userRole = user.role; // Assuming role is in JWT payload

  let taskQueryFilter = {};

  // Role-based filtering
  if (userRole === "office_admin") {
    // Admin sees tasks they created/assigned
    taskQueryFilter = { assignedBy: userId };
  } else if (userRole === "worker") {
    // Worker sees tasks assigned to them
    taskQueryFilter = { assignedTo: userId };
  } else {
    throw new AppError(HttpStatus.FORBIDDEN, "Invalid user role");
  }

  const taskQuery = new QueryBuilder(
    SiteTaskModel.find(taskQueryFilter)
      .populate("assignedTo", "name email phone")
      .populate("assignedBy", "name email")
      .populate("siteId", "siteTitle location status")
      .populate("fileId", "fileName fileUrl fileType"),
    query,
  )
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await taskQuery.countTotal();
  const result = await taskQuery.modelQuery;

  return { meta, result };
};

const getEachTask = async (taskId: string) => {
  const result = await SiteTaskModel.findById(taskId);
  if (!result) {
    throw new AppError(HttpStatus.NOT_FOUND, "Task not found");
  }
  return result;
};

const updateTaskStatus = async (
  payload: { status: "To-Do" | "In-Progress" | "Done" | "Remark" },
  taskId: string,
) => {
  const { status } = payload;
  const validStatuses = ["To-Do", "In-Progress", "Done", "Remark"];
  if (!validStatuses.includes(status)) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Invalid status");
  }
  const updated = await SiteTaskModel.findOneAndUpdate(
    { _id: taskId },
    {
      $set: {
        status,
        ...(status === "Done" && { completedAt: new Date() }),
      },
    },
    { new: true },
  );
  if (!updated) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Status update failed");
  }
  return { status: updated.status };
};

export const taskServices = {
  assignTask,
  getMyTasks,
  getEachTask,
  updateTaskStatus,
};
