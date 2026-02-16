import HttpStatus from "http-status";
import { JwtPayload } from "../../interface/global";
import { ISiteTaskComment } from "./comment.interface";
import { SiteTaskCommentModel } from "./comment.model";
import { SiteTaskModel } from "../SiteTask/task.model";
import { UserModel } from "../User/user.model";
import AppError from "../../erros/AppError";
import { sendFileToCloudinary } from "../../utils/sendImageToCloudinary";
import mongoose, { Types } from "mongoose";

const addComment = async (
  user: JwtPayload,
  taskId: string,
  payload: ISiteTaskComment,
  files?: Express.Multer.File[],
) => {
  const userId = new Types.ObjectId(user.user);
  const { message } = payload;

  // ✅ Validation 1: Message is required
  if (!message) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Comment message is required");
  }

  // ✅ Validation 2: Check if user exists
  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  // ✅ Validation 3: Check if task exists
  const task = await SiteTaskModel.findById(taskId);
  if (!task) {
    throw new AppError(HttpStatus.NOT_FOUND, "Task not found");
  }

  // ✅ Validation 4: Can only comment on "In-Progress" tasks
  if (task.status !== "In-Progress") {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Comments can only be added to tasks with 'In-Progress' status",
    );
  }

  // ✅ Validation 5: Worker can only comment on their assigned tasks
  if (
    isUserExist.role === "worker" &&
    task.assignedTo?.toString() !== userId.toString()
  ) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "You can only comment on tasks assigned to you",
    );
  }

  // ✅ Validation 6: Image count limit
  if (files && files.length > 5) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Maximum 5 images allowed per comment",
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
    // ✅ Create new comment
    const [newComment] = await SiteTaskCommentModel.create(
      [
        {
          taskId,
          siteId: task.siteId,
          fileId: task.fileId,
          commentedBy: isUserExist._id,
          userRole: isUserExist.role,
          message: message.trim(),
          images: imageUrls,
        },
      ],
      { session },
    );

    // ✅ Populate user details
    const populatedComment = await SiteTaskCommentModel.findById(newComment._id)
      .session(session)
      .populate("commentedBy", "name email");

    // ✅ Commit transaction
    await session.commitTransaction();
    await session.endSession();

    return populatedComment;
  } catch (error) {
    // ✅ Rollback transaction on error
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
};

// ✅ Get all comments for a task (chronological order)
const getCommentsByTaskId = async (taskId: string) => {
  // ✅ Check if task exists
  const task = await SiteTaskModel.findById(taskId);
  if (!task) {
    throw new AppError(HttpStatus.NOT_FOUND, "Task not found");
  }

  const comments = await SiteTaskCommentModel.find({ taskId })
    .populate("commentedBy", "name email role")
    .sort({ createdAt: 1 }); // Oldest first (chronological like chat)

  return comments;
};

// ✅ Delete comment (user can delete their own comment)
const deleteComment = async (commentId: string, userData: JwtPayload) => {
  const userId = new Types.ObjectId(userData.user);
  const comment = await SiteTaskCommentModel.findById(commentId);

  if (!comment) {
    throw new AppError(HttpStatus.NOT_FOUND, "Comment not found");
  }

  // ✅ Check if user is the comment owner or admin
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  if (
    comment.commentedBy.toString() !== userId.toString() &&
    user.role !== "office_admin"
  ) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "You can only delete your own comments or admin can delete any comment",
    );
  }

  await SiteTaskCommentModel.findByIdAndUpdate(
    commentId,
    {
      isDeleted: true,
    },
    { new: true },
  );

  return { message: "Comment deleted successfully" };
};

// ✅ Update comment (user can edit their own comment)
const updateComment = async (
  commentId: string,
  userData: JwtPayload,
  message: string,
) => {
  const userId = new Types.ObjectId(userData.user);
  if (!message || message.trim() === "") {
    throw new AppError(HttpStatus.BAD_REQUEST, "Comment message is required");
  }

  const comment = await SiteTaskCommentModel.findById(commentId);

  if (!comment) {
    throw new AppError(HttpStatus.NOT_FOUND, "Comment not found");
  }

  // ✅ Only comment owner can edit
  if (comment.commentedBy.toString() !== userId.toString()) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "You can only edit your own comments",
    );
  }

  const updatedComment = await SiteTaskCommentModel.findByIdAndUpdate(
    commentId,
    { message: message.trim() },
    { new: true, runValidators: true },
  ).populate("commentedBy", "name email role");

  return updatedComment;
};

export const commentServices = {
  addComment,
  getCommentsByTaskId,
  deleteComment,
  updateComment,
};
