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
import { NotificationModel } from "../Notification/notification.model";
import { sendPushNotifications } from "../../utils/firebase/notification";

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

      if (item.mimetype.startsWith("image/")) {
        imageUrls.push(uploadResult.secure_url);
      } else if (item.mimetype === "application/pdf") {
        documentUrl = uploadResult.secure_url;
      }
    }
  }

  if (documentUrl) {
    await SiteFileModel.findByIdAndUpdate(fileId, { fileUrl: documentUrl });
  }

  /**
   * 🔎 CHECK IF TASK ALREADY EXISTS
   */
  let task = await SiteTaskModel.findOne({ fileId });

  let notificationType = "";
  let notificationTitle = "";
  let notificationMessage = "";

  if (task) {
    /**
     * 🔄 UPDATE EXISTING TASK (WITHOUT save())
     */
    const updateData: Partial<ISiteTask> = {
      title: payload.title,
      description: payload.description,
      assignedTo: payload.assignedTo,
      dueDate: payload.dueDate,
    };

    if (imageUrls.length > 0) {
      updateData.images = imageUrls;
    }

    task = await SiteTaskModel.findOneAndUpdate(
      { fileId },
      { $set: updateData },
      { new: true },
    );

    if (!task) {
      throw new AppError(HttpStatus.NOT_FOUND, "Task not found after update");
    }

    notificationType = "task_updated";
    notificationTitle = "Task Updated";
    notificationMessage = `Your assigned task has been updated: ${payload.title}`;
  } else {
    /**
     * 🆕 CREATE NEW TASK
     */
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
      images: imageUrls,
    };

    task = await SiteTaskModel.create(taskData);

    notificationType = "task_assigned";
    notificationTitle = "New Task Assigned";
    notificationMessage = `You have been assigned a new task: ${payload.title}`;
  }

  // Populate references
  await task.populate([
    { path: "assignedTo", select: "name email phone" },
    { path: "assignedBy", select: "name email" },
    { path: "siteId", select: "siteTitle location" },
    { path: "fileId", select: "fileName fileUrl fileType" },
  ]);

  /**
   * 🔔 CREATE NOTIFICATION
   */
  await NotificationModel.create({
    sender: new Types.ObjectId(user.user),
    recipient: worker._id,
    type: notificationType,
    title: notificationTitle,
    message: notificationMessage,
  });

  /**
   * 📲 SEND PUSH NOTIFICATION
   */
  if (worker.fcmToken && worker.fcmToken.length > 0) {
    await sendPushNotifications(
      worker.fcmToken,
      notificationTitle,
      notificationMessage,
    );
  }

  return task;
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
  const result = await SiteTaskModel.findById(taskId)
    .populate("siteId", "photos siteTitle")
    .populate("fileId", "fileUrl fileName")
    .populate("assignedTo", "name email role")
    .populate("assignedBy", "name email role");

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
