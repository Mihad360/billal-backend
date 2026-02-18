import HttpStatus from "http-status";
import { JwtPayload } from "../../interface/global";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { taskServices } from "./task.service";

const assignTask = catchAsync(async (req, res) => {
  const id = req.params.fileId;
  const files = req.files as Express.Multer.File[];
  const result = await taskServices.assignTask(
    req.user as JwtPayload,
    id,
    req.body,
    files,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset OTP sent to email",
    data: result,
  });
});

const getMyTasks = catchAsync(async (req, res) => {
  const result = await taskServices.getMyTasks(
    req.user as JwtPayload,
    req.query,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset OTP sent to email",
    meta: result.meta,
    data: result.result,
  });
});

const getEachTask = catchAsync(async (req, res) => {
  const id = req.params.taskId;
  const result = await taskServices.getEachTask(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset OTP sent to email",
    data: result,
  });
});

const updateTaskStatus = catchAsync(async (req, res) => {
  const id = req.params.taskId;
  const result = await taskServices.updateTaskStatus(req.body, id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset OTP sent to email",
    data: result,
  });
});

export const taskControllers = {
  assignTask,
  getMyTasks,
  getEachTask,
  updateTaskStatus,
};
