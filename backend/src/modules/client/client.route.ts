import { Router } from "express";
import authRouter from "./auth/auth.route.js";
import * as clientController from "./client.controller.js";
import { authenticate, authorize } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validation.middleware.js";
import {
  updateClientProfileSchema,
  changeClientPasswordSchema,
} from "./client.validation.js";
import tripRouter from "../trip/trip.route.js";
import * as pricingController from "../pricing/pricing.controller.js";
const router = Router();

router.use("/auth", authRouter);
router.use("/trips", tripRouter);
router.get(
  "/pricing",
  authenticate,
  authorize("CLIENT"),
  pricingController.getPublicPricing,
);
router.get("/me", authenticate, authorize("CLIENT"), clientController.getMe);
router.patch(
  "/me",
  authenticate,
  authorize("CLIENT"),
  validate(updateClientProfileSchema),
  clientController.updateMe,
);
router.patch(
  "/me/password",
  authenticate,
  authorize("CLIENT"),
  validate(changeClientPasswordSchema),
  clientController.changePassword,
);
router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  clientController.getAllClients,
);
export default router;
