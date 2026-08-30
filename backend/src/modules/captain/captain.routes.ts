import { Router } from "express";
import * as captainController from "./captain.controller.js";
import { updateCaptainProfileSchema } from "./captain.validation.js";
import { validate } from "../../middlewares/validation.middleware.js";
import authRouter from "./auth/auth.route.js";
import { authenticate, authorize } from "../../middlewares/auth.js";

const router = Router();

router.use("/auth", authRouter);

router.get("/me", authenticate, authorize("CAPTAIN"), captainController.getMe);
router.patch(
  "/me",
  authenticate,
  authorize("CAPTAIN"),
  validate(updateCaptainProfileSchema),
  captainController.updateMe,
);

router.get("/", captainController.getAllCaptains);
router.get("/:id", captainController.getCaptainById);
router.patch("/:id/block", captainController.blockCaptain);
router.patch("/:id/unblock", captainController.unblockCaptain);
router.patch("/:id/reset-amount-due", captainController.resetAmountDue);

export default router;
