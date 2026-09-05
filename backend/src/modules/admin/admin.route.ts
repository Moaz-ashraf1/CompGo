import { Router } from "express";
import * as adminController from "./admin.controller.js";
import {
  updateCaptainPhoneSchema,
  resetPasswordSchema,
} from "./admin.validation.js";
import { validate } from "../../middlewares/validation.middleware.js";
import { authenticate, authorize } from "../../middlewares/auth.js";
import authRouter from "../auth/auth.route.js";

const router = Router();

router.use("/auth", authRouter);

router.use(authenticate, authorize("ADMIN"));

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
  "/clients/:id/password",
  validate(resetPasswordSchema),
  adminController.resetClientPassword,
);

export default router;
