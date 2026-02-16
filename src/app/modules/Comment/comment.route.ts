import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { commentControllers } from "./comment.controller";
import { upload } from "../../utils/sendImageToCloudinary";

const router = express.Router();

router.get(
  "/:taskId",
  auth("office_admin", "worker"),
  commentControllers.getCommentsByTaskId,
);
router.post(
  "/add/:taskId",
  auth("office_admin", "worker"),
  upload.array("images", 5),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  commentControllers.addComment,
);
router.patch(
  "/:commentId",
  auth("office_admin", "worker"),
  commentControllers.updateComment,
);
router.delete(
  "/:commentId",
  auth("office_admin", "worker"),
  commentControllers.deleteComment,
);

export const commentRoutes = router;
