import { Router } from "express";
import { userRoutes } from "../modules/User/user.routes";
import { AuthRoutes } from "../modules/Auth/auth.route";
import { AboutRoutes } from "../modules/Settings/About/About.route";
import { TermsRoutes } from "../modules/Settings/Terms/Terms.route";
import { PrivacyRoutes } from "../modules/Settings/privacy/Privacy.route";
import { siteRoutes } from "../modules/Site/site.route";
import { siteFileRoutes } from "../modules/SiteFile/sitefile.route";

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
    path: "/site",
    route: siteRoutes,
  },
  {
    path: "/site-file",
    route: siteFileRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route?.route));

export default router;
