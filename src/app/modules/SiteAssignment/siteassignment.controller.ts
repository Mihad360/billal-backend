import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { siteAssignmentServices } from "./siteassignment.service";
import { JwtPayload } from "../../interface/global";

const assignTaskToWorker = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await siteAssignmentServices.assignTaskToWorker(
    user,
    req.body,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset OTP sent to email",
    data: result,
  });
});

export const siteAssignmentControllers = {
  assignTaskToWorker,
};
