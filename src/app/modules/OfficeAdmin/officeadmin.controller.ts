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

export const officeAdminControllers = {
  addWorker,
};
