import { Router } from "express";
import * as appSettingsController from "./app-settings.controller.js";
import { updateAppSettingsSchema } from "./app-settings.validation.js";
import { validate } from "../../middlewares/validation.middleware.js";
import { authenticate, authorize } from "../../middlewares/auth.js";

const router = Router();
router.use(authenticate, authorize("ADMIN"));
router.get("/", appSettingsController.getSettings);
router.put(
  "/",
  validate(updateAppSettingsSchema),
  appSettingsController.updateSettings,
);

export default router;
