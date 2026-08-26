import { Router } from "express";
import * as authController from "./auth.controller.js";

const router = Router();

router.post("/refresh", authController.refresh);

export default router;
