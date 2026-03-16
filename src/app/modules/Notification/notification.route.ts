import express from "express";
import { notificationControllers } from "./notification.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.get(
  "/",
  auth("admin", "worker", "office_admin"),
  notificationControllers.getMyNotifications,
);

export const NotificationRoutes = router;
