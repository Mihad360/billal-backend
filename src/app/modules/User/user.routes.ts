import express from "express";
import auth from "../../middlewares/auth";
import { userControllers } from "./user.controller";

const router = express.Router();

router.get(
  "/me",
  auth("admin", "office_admin", "worker"),
  userControllers.getMe,
);

export const userRoutes = router;
