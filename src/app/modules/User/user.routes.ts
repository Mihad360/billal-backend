import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { userControllers } from "./user.controller";
import { upload } from "../../utils/sendImageToCloudinary";

const router = express.Router();

router.get("/", userControllers.getUsers);
router.get(
  "/me",
  auth("admin", "office_admin", "worker"),
  userControllers.getMe,
);
router.patch(
  "/edit-profile",
  auth("admin", "office_admin", "worker"),
  upload.single("image"),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  userControllers.editProfile,
);

export const userRoutes = router;
