import express from "express";
import auth from "../../middlewares/auth";
import { officeAdminControllers } from "./officeadmin.controller";

const router = express.Router();

router.get(
  "/dashboard-stats",
  auth("office_admin"),
  officeAdminControllers.getOfficeAdminDashboardStats,
);
router.get(
  "/employes",
  auth("office_admin"),
  officeAdminControllers.getAllEmployees,
);
router.get("/sites", auth("office_admin"), officeAdminControllers.getAllSites);
router.get(
  "/assigned-sites",
  auth("office_admin"),
  officeAdminControllers.getSitesWithAssignedUsers,
);
router.get(
  "/assigned-tasks/:siteId/:userId",
  auth("office_admin"),
  officeAdminControllers.getSiteAssignedUserTasks,
);
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
