import { Router } from "express";
import * as captainController from "./captain.controller.js";
import {
  updateCaptainProfileSchema,
  updateAvailabilitySchema,
  changeCaptainPasswordSchema,
} from "./captain.validation.js";
import { validate } from "../../middlewares/validation.middleware.js";
import authRouter from "./auth/auth.route.js";
import { authenticate, authorize } from "../../middlewares/auth.js";
import tripRouter from "./trip/trip.route.js";
import * as pricingController from "../pricing/pricing.controller.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/trips", tripRouter);

router.get("/me", authenticate, authorize("CAPTAIN"), captainController.getMe);
router.patch(
  "/me",
  authenticate,
  authorize("CAPTAIN"),
  validate(updateCaptainProfileSchema),
  captainController.updateMe,
);
router.get(
  "/wallet",
  authenticate,
  authorize("CAPTAIN"),
  captainController.getWallet,
);
router.patch(
  "/availability",
  authenticate,
  authorize("CAPTAIN"),
  validate(updateAvailabilitySchema),
  captainController.updateAvailability,
);
router.patch(
  "/me/password",
  authenticate,
  authorize("CAPTAIN"),
  validate(changeCaptainPasswordSchema),
  captainController.changePassword,
);
router.get(
  "/pricing",
  authenticate,
  authorize("CAPTAIN"),
  pricingController.getPublicPricing,
);

router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  captainController.getAllCaptains,
);
router.get(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  captainController.getCaptainById,
);
router.patch(
  "/:id/block",
  authenticate,
  authorize("ADMIN"),
  captainController.blockCaptain,
);
router.patch(
  "/:id/unblock",
  authenticate,
  authorize("ADMIN"),
  captainController.unblockCaptain,
);
router.patch(
  "/:id/reset-amount-due",
  authenticate,
  authorize("ADMIN"),
  captainController.resetAmountDue,
);

export default router;
