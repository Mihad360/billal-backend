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

const createPayment = catchAsync(async (req, res) => {
  const id = req.params.planId;
  const result = await subscriptionServices.createPayment(
    id,
    req.user as JwtPayload,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset OTP sent to email",
    data: result,
  });
});

const getPlans = catchAsync(async (req, res) => {
  const result = await subscriptionServices.getPlans(req.query);

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
  createPayment,
  getPlans,
};
