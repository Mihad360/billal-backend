import express from "express";
import auth from "../../middlewares/auth";
import { subscriptionControllers } from "./subscription.controller";

const router = express.Router();

router.get("/plans", auth("admin"), subscriptionControllers.getPlans);
router.post(
  "/free-plan",
  auth("office_admin"),
  subscriptionControllers.freeTrialPlan,
);
router.post("/create", subscriptionControllers.createSubscriptionPlan);
router.post(
  "/create-payment/:planId",
  auth("office_admin"),
  subscriptionControllers.createPayment,
);

export const subscriptionRoutes = router;
