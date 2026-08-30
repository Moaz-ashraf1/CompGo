import { Router } from "express";
import * as captainController from "./captain.controller.js";
import { registerCaptainSchema } from "./captain.validation.js";
import { validate } from "../../middlewares/validation.middleware.js";
import authRouter from "./auth/auth.route.js";
const router = Router();

router.get("/", captainController.getAllCaptains);
router.get("/:id", captainController.getCaptainById);
router.patch("/:id/block", captainController.blockCaptain);
router.patch("/:id/unblock", captainController.unblockCaptain);
router.patch("/:id/reset-amount-due", captainController.resetAmountDue);
router.use("/auth", authRouter);

export default router;
