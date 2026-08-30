import { Router } from "express";
import {
  registerCaptainSchema,
  loginCaptainSchema,
} from "../captain.validation.js";
import * as authController from "./auth.controller.js";
import { validate } from "../../../middlewares/validation.middleware.js";

const router = Router();

router.post(
  "/register",
  validate(registerCaptainSchema),
  authController.registerCaptain,
);
router.post(
  "/login",
  validate(loginCaptainSchema),
  authController.loginCaptain,
);

export default router;
