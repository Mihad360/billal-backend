import express from "express";
import auth from "../../middlewares/auth";
import { officeAdminControllers } from "./officeadmin.controller";

const router = express.Router();

router.post(
  "/add-worker",
  auth("office_admin"),
  officeAdminControllers.addWorker,
);

export const officeAdminRoutes = router;
