import { Router } from "express";
import * as adminController from "./admin.controller.js";
import * as reportsController from "../reports/reports.controller.js";
import * as notificationController from "../notification/notification.controller.js";
import * as bonusTierController from "../bonus-tier/bonus-tier.controller.js";
import * as settlementController from "../settlement/settlement.controller.js";
import {
  updateCaptainPhoneSchema,
  resetPasswordSchema,
  resetClientPasswordByPhoneSchema,
  adjustCaptainBalanceSchema,
  recordCaptainTransferSchema,
} from "./admin.validation.js";
import {
  createBonusTierSchema,
  updateBonusTierSchema,
} from "../bonus-tier/bonus-tier.validation.js";
import * as offersController from "../offers/offers.controller.js";
import {
  createPromoCodeSchema,
  updatePromoCodeSchema,
  grantCreditSchema,
  offerSettingsSchema,
} from "../offers/offers.validation.js";
import * as familyController from "../family/family.controller.js";
import * as legalController from "../legal/legal.controller.js";
import { updateLegalPageSchema } from "../legal/legal.validation.js";
import { rejectSettlementSubmissionSchema } from "../settlement/settlement.validation.js";
import { validate } from "../../middlewares/validation.middleware.js";
import { authenticate, authorize } from "../../middlewares/auth.js";
import authRouter from "./auth/auth.route.js";
import * as adminUsersController from "../admin-users/admin-users.controller.js";
import {
  createAdminUserSchema,
  updateAdminUserSchema,
} from "../admin-users/admin-users.validation.js";
import {
  requirePermission as perm,
  requireSuperAdmin,
} from "../../middlewares/requirePermission.js";

const router = Router();

router.use("/auth", authRouter);

router.use(authenticate, authorize("ADMIN"));

router.get("/me", adminUsersController.getMe);

router.get(
  "/family-links",
  perm("clients", "VIEW"),
  familyController.adminList,
);
router.delete(
  "/family-links/:id",
  perm("clients", "EDIT"),
  familyController.adminRemove,
);

router.get("/legal", perm("settings", "VIEW"), legalController.getAll);
router.put(
  "/legal/:key",
  perm("settings", "EDIT"),
  validate(updateLegalPageSchema),
  legalController.update,
);
router.delete("/legal/:key", perm("settings", "EDIT"), legalController.reset);

router.get("/admins", requireSuperAdmin, adminUsersController.getAll);
router.post(
  "/admins",
  requireSuperAdmin,
  validate(createAdminUserSchema),
  adminUsersController.create,
);
router.patch(
  "/admins/:id",
  requireSuperAdmin,
  validate(updateAdminUserSchema),
  adminUsersController.update,
);
router.delete("/admins/:id", requireSuperAdmin, adminUsersController.remove);

router.get(
  "/reports/overview",
  perm("reports", "VIEW"),
  reportsController.getOverview,
);
router.get(
  "/reports/captain-commissions",
  perm("reports", "VIEW"),
  reportsController.getCaptainCommissions,
);
router.get(
  "/reports/captain-bonuses",
  perm("reports", "VIEW"),
  reportsController.getCaptainBonuses,
);

router.get(
  "/bonus-tiers",
  perm("reports", "VIEW"),
  bonusTierController.getAllBonusTiers,
);
router.post(
  "/bonus-tiers",
  perm("reports", "EDIT"),
  validate(createBonusTierSchema),
  bonusTierController.createBonusTier,
);
router.patch(
  "/bonus-tiers/:id",
  perm("reports", "EDIT"),
  validate(updateBonusTierSchema),
  bonusTierController.updateBonusTier,
);
router.delete(
  "/bonus-tiers/:id",
  perm("reports", "EDIT"),
  bonusTierController.deleteBonusTier,
);

router.get(
  "/settlements",
  perm("settlements", "VIEW"),
  settlementController.getAllSubmissions,
);
router.patch(
  "/settlements/:id/approve",
  perm("settlements", "EDIT"),
  settlementController.approveSubmission,
);
router.patch(
  "/settlements/:id/reject",
  perm("settlements", "EDIT"),
  validate(rejectSettlementSubmissionSchema),
  settlementController.rejectSubmission,
);

router.get(
  "/promo-codes",
  perm("offers", "VIEW"),
  offersController.getPromoCodes,
);
router.post(
  "/promo-codes",
  perm("offers", "EDIT"),
  validate(createPromoCodeSchema),
  offersController.createPromoCode,
);
router.patch(
  "/promo-codes/:id",
  perm("offers", "EDIT"),
  validate(updatePromoCodeSchema),
  offersController.updatePromoCode,
);
router.delete(
  "/promo-codes/:id",
  perm("offers", "EDIT"),
  offersController.deletePromoCode,
);
router.post(
  "/credit/grant",
  perm("offers", "EDIT"),
  validate(grantCreditSchema),
  offersController.grantCredit,
);
router.get(
  "/credit/transactions",
  perm("offers", "VIEW"),
  offersController.getCreditTransactions,
);
router.get(
  "/offers/settings",
  perm("offers", "VIEW"),
  offersController.getOfferSettings,
);
router.put(
  "/offers/settings",
  perm("offers", "EDIT"),
  validate(offerSettingsSchema),
  offersController.updateOfferSettings,
);

router.get(
  "/notifications",
  perm("notifications", "VIEW"),
  notificationController.getAllForAdmin,
);

router.get(
  "/wallet-transactions",
  perm("wallet", "VIEW"),
  adminController.getWalletTransactions,
);

router.get("/trips", perm("trips", "VIEW"), adminController.getTrips);
router.get("/trips/:id", perm("trips", "VIEW"), adminController.getTripDetail);
router.get(
  "/trips/:id/messages",
  perm("trips", "VIEW"),
  adminController.getTripMessages,
);

router.get(
  "/captains/:id",
  perm("captains", "VIEW"),
  adminController.getCaptainDetail,
);
router.patch(
  "/captains/:id/phone",
  perm("captains", "EDIT"),
  validate(updateCaptainPhoneSchema),
  adminController.updateCaptainPhone,
);
router.patch(
  "/captains/:id/password",
  perm("captains", "EDIT"),
  validate(resetPasswordSchema),
  adminController.resetCaptainPassword,
);
// Permanent deletion of an account and all its data - super admins only.
router.get(
  "/captains/:id/deletion-preview",
  requireSuperAdmin,
  adminController.getAccountDeletionPreview("CAPTAIN"),
);
router.delete(
  "/captains/:id",
  requireSuperAdmin,
  adminController.deleteAccountPermanently("CAPTAIN"),
);
router.get(
  "/clients/:id/deletion-preview",
  requireSuperAdmin,
  adminController.getAccountDeletionPreview("CLIENT"),
);
router.delete(
  "/clients/:id",
  requireSuperAdmin,
  adminController.deleteAccountPermanently("CLIENT"),
);
router.get(
  "/captains/:id/wallet-summary",
  perm("wallet", "VIEW"),
  adminController.getCaptainWalletSummary,
);
router.post(
  "/captains/:id/transfers",
  perm("wallet", "EDIT"),
  validate(recordCaptainTransferSchema),
  adminController.recordCaptainTransfer,
);
router.post(
  "/captains/:id/transfers/:txId/cancel",
  perm("wallet", "EDIT"),
  adminController.cancelCaptainTransfer,
);
router.patch(
  "/captains/:id/wallet-adjustment",
  perm("wallet", "EDIT"),
  validate(adjustCaptainBalanceSchema),
  adminController.adjustCaptainBalance,
);
router.patch(
  "/clients/password",
  perm("clients", "EDIT"),
  validate(resetClientPasswordByPhoneSchema),
  adminController.resetClientPassword,
);

export default router;
