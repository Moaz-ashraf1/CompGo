import { Router } from "express";
import { registerClientSchema } from "./auth.validation.js";
import * as authController from "./auth.controller.js";
import { validate } from "../../../middlewares/validation.middleware.js";

const router = Router();

router.post(
  "/register",
  validate(registerClientSchema),
  authController.registerClient,
);

export default router;
