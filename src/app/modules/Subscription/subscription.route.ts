import express from "express";
import auth from "../../middlewares/auth";
import { subscriptionControllers } from "./subscription.controller";

const router = express.Router();

router.post(
  "/free-plan",
  auth("office_admin"),
  subscriptionControllers.freeTrialPlan,
);
router.post("/create", subscriptionControllers.createSubscriptionPlan);
router.post(
  "/premium-plan/:planId",
  auth("office_admin"),
  subscriptionControllers.buyPremiumPlan,
);

export const subscriptionRoutes = router;
