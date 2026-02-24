import express from "express";
import auth from "../../middlewares/auth";
import { adminControllers } from "./admin.controller";

const router = express.Router();

router.get(
  "/dashboard-stats",
  auth("admin"),
  adminControllers.getDashboardStats,
);
router.get("/companies", auth("admin"), adminControllers.getCompanies);
router.get(
  "/user-subscriptions",
  auth("admin"),
  adminControllers.getUserSubscriptions,
);
router.get(
  "/:companyId/subscription",
  auth("admin"),
  adminControllers.getCompanySubscription,
);
router.get(
  "/company/users/:companyId",
  auth("admin"),
  adminControllers.getUsersUnderCompanyDetails,
);

export const adminRoutes = router;
