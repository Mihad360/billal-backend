/* eslint-disable @typescript-eslint/no-explicit-any */
import HttpStatus from "http-status";
import { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import AppError from "../../erros/AppError";
import { NotificationModel } from "./notification.model";
import { UserModel } from "../User/user.model";
import QueryBuilder from "../../../builder/QueryBuilder";

const getMyNotifications = async (
  user: JwtPayload,
  query: Record<string, unknown>,
) => {
  const userId = new Types.ObjectId(user.user);

  // Check user
  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  let filter: any = {};

  // Role-based filters
  if (user.role === "admin") {
    filter = {
      $or: [{ type: "user_login" }, { type: "user_registration" }],
    };
  } else if (user.role === "office_admin") {
    filter = {
      recipient: userId,
      $or: [{ type: "task_assigned" }, { type: "task_updated" }],
    };
  } else if (user.role === "worker") {
    filter = {
      recipient: userId,
      $or: [{ type: "task_assigned" }, { type: "task_updated" }],
    };
  } else {
    throw new AppError(HttpStatus.FORBIDDEN, "Invalid role");
  }

  const notificationQuery = new QueryBuilder(
    NotificationModel.find(filter).populate({
      path: "sender",
      select: "name",
    }),
    query,
  )
    .search(["type"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await notificationQuery.countTotal();
  const notifications = await notificationQuery.modelQuery;

  if (!notifications.length) {
    throw new AppError(HttpStatus.NOT_FOUND, "Notification not available");
  }

  return {
    meta,
    data: notifications,
  };
};

export const notificationServices = {
  getMyNotifications,
};
