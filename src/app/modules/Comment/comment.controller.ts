// comment.controller.ts
import HttpStatus from "http-status";
import { JwtPayload } from "../../interface/global";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { commentServices } from "./comment.service";

const addComment = catchAsync(async (req, res) => {
  const id = req.params.taskId;
  const files = req.files as Express.Multer.File[];
  const result = await commentServices.addComment(
    req.user as JwtPayload,
    id,
    req.body,
    files,
  );

  sendResponse(res, {
    statusCode: HttpStatus.CREATED,
    success: true,
    message: "Comment added successfully",
    data: result,
  });
});

const getCommentsByTaskId = catchAsync(async (req, res) => {
  const id = req.params.taskId;
  const result = await commentServices.getCommentsByTaskId(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Comments retrieved successfully",
    data: result,
  });
});

const deleteComment = catchAsync(async (req, res) => {
  const id = req.params.commentId;
  const userId = req.user as JwtPayload;
  const result = await commentServices.deleteComment(id, userId);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

const updateComment = catchAsync(async (req, res) => {
  const id = req.params.commentId;
  const userId = req.user as JwtPayload;
  const { message } = req.body;
  const result = await commentServices.updateComment(id, userId, message);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Comment updated successfully",
    data: result,
  });
});

export const commentControllers = {
  addComment,
  getCommentsByTaskId,
  deleteComment,
  updateComment,
};
