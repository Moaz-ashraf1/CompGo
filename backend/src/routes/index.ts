import { Router } from "express";
import authRoutes from "../modules/auth/auth.route.js";
import captainRoutes from "../modules/captain/captain.routes.js";
import compoundBoundaryRoutes from "../modules/compound-boundary/compound-boundary.routes.js";
import pricingRoutes from "../modules/pricing/pricing.routes.js";
const router = Router();

router.use("/auth", authRoutes);
router.use("/captains", captainRoutes);
router.use("/compound-boundary", compoundBoundaryRoutes);
router.use("/pricing", pricingRoutes);

export default router;
