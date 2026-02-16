import HttpStatus from "http-status";
import { JwtPayload } from "../../interface/global";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { remarkServices } from "./remark.service";

const addRemark = catchAsync(async (req, res) => {
  const id = req.params.taskId;
  const files = req.files as Express.Multer.File[];
  const result = await remarkServices.addRemark(
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

const getRemarkByTaskId = catchAsync(async (req, res) => {
  const id = req.params.taskId;
  const result = await remarkServices.getRemarkByTaskId(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset OTP sent to email",
    data: result,
  });
});

export const remarkControllers = {
  addRemark,
  getRemarkByTaskId,
};
