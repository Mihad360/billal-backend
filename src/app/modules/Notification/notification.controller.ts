import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { notificationServices } from "./notification.service";
import { JwtPayload } from "../../interface/global";

const getMyNotifications = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await notificationServices.getMyNotifications(user, req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Notifications retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

export const notificationControllers = {
  getMyNotifications,
};
