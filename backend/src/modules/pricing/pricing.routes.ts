import { Router } from "express";
import * as pricingController from "./pricing.controller.js";
import { updatePricingSchema } from "./pricing.validation.js";
import { validate } from "../../middlewares/validation.middleware.js";

const router = Router();

router.get("/", pricingController.getPricing);
router.put("/", validate(updatePricingSchema), pricingController.updatePricing);

export default router;