import { Router } from "express";
import * as adminController from "./admin.controller.js";
import * as reportsController from "../reports/reports.controller.js";
import {
  updateCaptainPhoneSchema,
  resetPasswordSchema,
  resetClientPasswordByPhoneSchema,
  adjustCaptainBalanceSchema,
} from "./admin.validation.js";
import { validate } from "../../middlewares/validation.middleware.js";
import { authenticate, authorize } from "../../middlewares/auth.js";
import authRouter from "./auth/auth.route.js";

const router = Router();

router.use("/auth", authRouter);

router.use(authenticate, authorize("ADMIN"));

router.get("/reports/overview", reportsController.getOverview);

router.get("/captains/:id", adminController.getCaptainDetail);
router.patch(
  "/captains/:id/phone",
  validate(updateCaptainPhoneSchema),
  adminController.updateCaptainPhone,
);
router.patch(
  "/captains/:id/password",
  validate(resetPasswordSchema),
  adminController.resetCaptainPassword,
);
router.patch(
  "/captains/:id/wallet-adjustment",
  validate(adjustCaptainBalanceSchema),
  adminController.adjustCaptainBalance,
);
router.patch(
  "/clients/password",
  validate(resetClientPasswordByPhoneSchema),
  adminController.resetClientPassword,
);

export default router;
