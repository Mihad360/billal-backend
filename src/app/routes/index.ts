import { Router } from "express";
import { userRoutes } from "../modules/User/user.routes";
import { AuthRoutes } from "../modules/Auth/auth.route";
import { AboutRoutes } from "../modules/Settings/About/About.route";
import { TermsRoutes } from "../modules/Settings/Terms/Terms.route";
import { PrivacyRoutes } from "../modules/Settings/privacy/Privacy.route";
import { siteRoutes } from "../modules/Site/site.route";
import { siteFileRoutes } from "../modules/SiteFile/sitefile.route";
import { subscriptionRoutes } from "../modules/Subscription/subscription.route";
import { companyRoutes } from "../modules/Company/company.route";
import { officeAdminRoutes } from "../modules/OfficeAdmin/officeadmin.route";
import { taskRoutes } from "../modules/SiteTask/task.route";
import { remarkRoutes } from "../modules/Remark/remark.route";
import { commentRoutes } from "../modules/Comment/comment.route";

const router = Router();

const moduleRoutes = [
  {
    path: "/users",
    route: userRoutes,
  },
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/about",
    route: AboutRoutes,
  },
  {
    path: "/terms",
    route: TermsRoutes,
  },
  {
    path: "/privacy",
    route: PrivacyRoutes,
  },
  {
    path: "/company",
    route: companyRoutes,
  },
  {
    path: "/site",
    route: siteRoutes,
  },
  {
    path: "/site-file",
    route: siteFileRoutes,
  },
  {
    path: "/subscription",
    route: subscriptionRoutes,
  },
  {
    path: "/office-admin",
    route: officeAdminRoutes,
  },
  {
    path: "/task",
    route: taskRoutes,
  },
  {
    path: "/remark",
    route: remarkRoutes,
  },
  {
    path: "/comment",
    route: commentRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route?.route));

export default router;
