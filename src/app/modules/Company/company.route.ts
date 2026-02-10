import express from "express";
import auth from "../../middlewares/auth";
import { companyControllers } from "./company.controller";

const router = express.Router();

router.post("/add", auth("office_admin"), companyControllers.addCompany);

export const companyRoutes = router;
