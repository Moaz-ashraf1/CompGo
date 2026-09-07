import { Router } from "express";
import * as pricingController from "./pricing.controller.js";
import { updatePricingSchema } from "./pricing.validation.js";
import { validate } from "../../middlewares/validation.middleware.js";
import { authenticate, authorize } from "../../middlewares/auth.js";

const router = Router();
router.use(authenticate, authorize("ADMIN"));
router.get("/", pricingController.getPricing);
router.put("/", validate(updatePricingSchema), pricingController.updatePricing);

export default router;
