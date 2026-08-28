import { Router } from "express";
import authRouter from "./auth/auth.route.js";
import * as clientController from "./client.controller.js";
import { authenticate, authorize } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validation.middleware.js";
import { updateClientProfileSchema } from "./client.validation.js";
const router = Router();

router.use("/auth", authRouter);
router.get("/me", authenticate, authorize("CLIENT"), clientController.getMe);
router.patch(
  "/me",
  authenticate,
  authorize("CLIENT"),
  validate(updateClientProfileSchema),
  clientController.updateMe,
);
export default router;
