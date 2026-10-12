import { Router } from "express";
import authRouter from "./auth/auth.route.js";
import * as clientController from "./client.controller.js";
import { authenticate, authorize } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validation.middleware.js";
import {
  updateClientProfileSchema,
  changeClientPasswordSchema,
} from "./client.validation.js";
import { requirePermission as perm } from "../../middlewares/requirePermission.js";
import * as offersController from "../offers/offers.controller.js";
import { validatePromoSchema } from "../offers/offers.validation.js";
import * as familyController from "../family/family.controller.js";
import {
  sendFamilyRequestSchema,
  respondFamilyRequestSchema,
} from "../family/family.validation.js";
import tripRouter from "../trip/trip.route.js";
import * as pricingController from "../pricing/pricing.controller.js";
import * as appSettingsController from "../app-settings/app-settings.controller.js";
import * as deviceTokenController from "../device-token/device-token.controller.js";
import {
  registerDeviceTokenSchema,
  removeDeviceTokenSchema,
} from "../device-token/device-token.validation.js";
import * as notificationController from "../notification/notification.controller.js";
const router = Router();

router.use("/auth", authRouter);
router.use("/trips", tripRouter);
router.get(
  "/pricing",
  authenticate,
  authorize("CLIENT"),
  pricingController.getPublicPricing,
);
router.get(
  "/app-settings",
  authenticate,
  authorize("CLIENT"),
  appSettingsController.getPublicSettings,
);
router.get("/family", authenticate, authorize("CLIENT"), familyController.list);
router.get(
  "/family/search",
  authenticate,
  authorize("CLIENT"),
  familyController.search,
);
router.post(
  "/family/requests",
  authenticate,
  authorize("CLIENT"),
  validate(sendFamilyRequestSchema),
  familyController.sendRequest,
);
router.post(
  "/family/requests/:id/respond",
  authenticate,
  authorize("CLIENT"),
  validate(respondFamilyRequestSchema),
  familyController.respond,
);
router.delete(
  "/family/links/:id",
  authenticate,
  authorize("CLIENT"),
  familyController.remove,
);
router.get(
  "/credit",
  authenticate,
  authorize("CLIENT"),
  offersController.getMyCredit,
);
router.post(
  "/promo/validate",
  authenticate,
  authorize("CLIENT"),
  validate(validatePromoSchema),
  offersController.validatePromo,
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
router.patch(
  "/me/device-token",
  authenticate,
  authorize("CLIENT"),
  validate(registerDeviceTokenSchema),
  deviceTokenController.registerDeviceToken,
);
router.delete(
  "/me/device-token",
  authenticate,
  authorize("CLIENT"),
  validate(removeDeviceTokenSchema),
  deviceTokenController.removeDeviceToken,
);
router.get(
  "/notifications",
  authenticate,
  authorize("CLIENT"),
  notificationController.getNotifications,
);
router.patch(
  "/notifications/read-all",
  authenticate,
  authorize("CLIENT"),
  notificationController.markAllRead,
);
router.patch(
  "/notifications/:id/read",
  authenticate,
  authorize("CLIENT"),
  notificationController.markRead,
);
router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  perm("clients", "VIEW"),
  clientController.getAllClients,
);
// Registered after every literal CLIENT-scoped route above (/me,
// /trips, /pricing, /notifications, ...) so this ADMIN ":id" catch-all
// never shadows one of them - see the notification-route note earlier
// in this project for the exact bug this ordering avoids.
router.get(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  perm("clients", "VIEW"),
  clientController.getClientDetail,
);
router.patch(
  "/:id/block",
  authenticate,
  authorize("ADMIN"),
  perm("clients", "EDIT"),
  clientController.blockClient,
);
router.patch(
  "/:id/unblock",
  authenticate,
  authorize("ADMIN"),
  perm("clients", "EDIT"),
  clientController.unblockClient,
);
export default router;
