import { Router } from "express";
import * as captainController from "./captain.controller.js";
import {
  updateCaptainProfileSchema,
  updateAvailabilitySchema,
  changeCaptainPasswordSchema,
  updateCaptainLocationSchema,
} from "./captain.validation.js";
import { validate } from "../../middlewares/validation.middleware.js";
import authRouter from "./auth/auth.route.js";
import { authenticate, authorize } from "../../middlewares/auth.js";
import tripRouter from "./trip/trip.route.js";
import * as pricingController from "../pricing/pricing.controller.js";
import * as deviceTokenController from "../device-token/device-token.controller.js";
import {
  registerDeviceTokenSchema,
  removeDeviceTokenSchema,
} from "../device-token/device-token.validation.js";

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
router.get(
  "/me/rating",
  authenticate,
  authorize("CAPTAIN"),
  captainController.getRating,
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
router.patch(
  "/me/location",
  authenticate,
  authorize("CAPTAIN"),
  validate(updateCaptainLocationSchema),
  captainController.updateLocation,
);
router.get(
  "/pricing",
  authenticate,
  authorize("CAPTAIN"),
  pricingController.getPublicPricing,
);
router.patch(
  "/me/device-token",
  authenticate,
  authorize("CAPTAIN"),
  validate(registerDeviceTokenSchema),
  deviceTokenController.registerDeviceToken,
);
router.delete(
  "/me/device-token",
  authenticate,
  authorize("CAPTAIN"),
  validate(removeDeviceTokenSchema),
  deviceTokenController.removeDeviceToken,
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
