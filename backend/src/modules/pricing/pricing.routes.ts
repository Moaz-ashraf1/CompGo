import { Router } from "express";
import * as pricingController from "./pricing.controller.js";
import { updatePricingSchema } from "./pricing.validation.js";
import { validate } from "../../middlewares/validation.middleware.js";
import { authenticate, authorize } from "../../middlewares/auth.js";
import { requirePermission } from "../../middlewares/requirePermission.js";

const router = Router();
router.use(authenticate, authorize("ADMIN"));
router.get("/", requirePermission("pricing", "VIEW"), pricingController.getPricing);
router.put(
  "/",
  requirePermission("pricing", "EDIT"),
  validate(updatePricingSchema), pricingController.updatePricing);

export default router;
