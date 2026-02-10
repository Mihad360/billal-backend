import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { companyServices } from "./company.service";
import { JwtPayload } from "../../interface/global";

const addCompany = catchAsync(async (req, res) => {
  const result = await companyServices.addCompany(
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

export const companyControllers = {
  addCompany,
};
