import { Router } from "express";
import * as authController from "./auth.controller.js";
import { authenticate } from "../../middlewares/auth.js";

const router = Router();

router.post("/refresh", authController.refresh);
router.post("/logout", authenticate, authController.logout);

export default router;
