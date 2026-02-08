import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { siteFileServices } from "./sitefile.service";
import { JwtPayload } from "../../interface/global";

const uploadFiles = catchAsync(async (req, res) => {
  const files = req.files as Express.Multer.File[];
  const result = await siteFileServices.uploadFiles(
    req.user as JwtPayload,
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

export const siteFileControllers = {
  uploadFiles,
};
