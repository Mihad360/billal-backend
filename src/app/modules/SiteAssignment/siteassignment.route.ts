import express from "express";
import auth from "../../middlewares/auth";
import { siteAssignmentControllers } from "./siteassignment.controller";

const router = express.Router();

router.post(
  "/task",
  auth("office_admin"),
  siteAssignmentControllers.assignTaskToWorker,
);

export const siteAssignmentRoutes = router;
