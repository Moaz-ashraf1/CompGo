import { Router } from "express";
import { loginAdminSchema } from "./auth.validation.js";
import * as authController from "./auth.controller.js";
import { validate } from "../../../middlewares/validation.middleware.js";

const router = Router();

router.post("/login", validate(loginAdminSchema), authController.loginAdmin);

export default router;
