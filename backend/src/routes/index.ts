import {Router } from "express";
import captainRoutes  from "../modules/captain/captain.routes.js";

const router = Router();

router.use("/captains", captainRoutes);

export default router;