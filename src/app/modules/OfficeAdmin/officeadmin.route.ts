import express from "express";
import auth from "../../middlewares/auth";
import { officeAdminControllers } from "./officeadmin.controller";

const router = express.Router();

router.post(
  "/add-worker",
  auth("office_admin"),
  officeAdminControllers.addWorker,
);
router.post(
  "/add-company-user",
  auth("office_admin"),
  officeAdminControllers.addCompanyUser,
);
router.post(
  "/reassign-task/:taskId",
  auth("office_admin"),
  officeAdminControllers.reassignTask,
);

export const officeAdminRoutes = router;
