import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { taskControllers } from "./task.controller";
import { upload } from "../../utils/sendImageToCloudinary";

const router = express.Router();

router.get("/", auth("office_admin", "worker"), taskControllers.getMyTasks);
router.get(
  "/:taskId",
  auth("office_admin", "worker"),
  taskControllers.getEachTask,
);
router.post(
  "/assign/:fileId",
  auth("office_admin"),
  upload.array("files", 3),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  taskControllers.assignTask,
);

export const taskRoutes = router;
