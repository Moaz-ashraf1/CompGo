import { Router } from "express";
import * as captainController from "./captain.controller.js";
import { createCaptainSchema } from "./captain.validation.js";
import { validate } from "../../middlewares/validation.middleware.js";

const router = Router();

router.post("/", validate(createCaptainSchema), captainController.registerCaptain);
router.get("/", captainController.getAllCaptains);
router.get("/:id", captainController.getCaptainById);
router.patch("/:id/block", captainController.blockCaptain);
router.patch("/:id/unblock", captainController.unblockCaptain);
router.patch("/:id/reset-amount-due", captainController.resetAmountDue);

export default router;