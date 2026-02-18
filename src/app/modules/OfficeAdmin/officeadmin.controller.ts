import HttpStatus from "http-status";
import { JwtPayload } from "../../interface/global";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { officeAdminServices } from "./officeadmin.service";

const addWorker = catchAsync(async (req, res) => {
  const result = await officeAdminServices.addWorker(
    req.body,
    req.user as JwtPayload,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset OTP sent to email",
    data: result,
  });
});

const addCompanyUser = catchAsync(async (req, res) => {
  const result = await officeAdminServices.addCompanyUser(
    req.body,
    req.user as JwtPayload,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset OTP sent to email",
    data: result,
  });
});

const reassignTask = catchAsync(async (req, res) => {
  const id = req.params.taskId;
  const user = req.user as JwtPayload;
  const result = await officeAdminServices.reassignTask(id, req.body, user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset OTP sent to email",
    data: result,
  });
});

export const officeAdminControllers = {
  addWorker,
  addCompanyUser,
  reassignTask,
};
