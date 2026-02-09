import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { subscriptionServices } from "./subscription.service";
import { JwtPayload } from "../../interface/global";

const freeTrialPlan = catchAsync(async (req, res) => {
  const result = await subscriptionServices.freeTrialPlan(
    req.user as JwtPayload,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset OTP sent to email",
    data: result,
  });
});

const createSubscriptionPlan = catchAsync(async (req, res) => {
  const result = await subscriptionServices.createSubscriptionPlan(req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset OTP sent to email",
    data: result,
  });
});

export const subscriptionControllers = {
  freeTrialPlan,
  createSubscriptionPlan,
};
