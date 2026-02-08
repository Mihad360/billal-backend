import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { siteFileControllers } from "./sitefile.controller";
import { upload } from "../../utils/sendImageToCloudinary";

const router = express.Router();

router.post(
  "/upload",
  auth("office_admin"),
  upload.array("files", 5),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  siteFileControllers.uploadFiles,
);

export const siteFileRoutes = router;
