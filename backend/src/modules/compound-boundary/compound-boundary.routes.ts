import { Router } from "express";
import * as boundaryController from "./compound-boundary.controller.js";
import { updateBoundarySchema } from "./compound-boundary.validation.js";
import { validate } from "../../middlewares/validation.middleware.js";
import { authenticate, authorize } from "../../middlewares/auth.js";
import { requirePermission } from "../../middlewares/requirePermission.js";

const router = Router();

router.use(authenticate, authorize("ADMIN"));
router.get("/", requirePermission("boundary", "VIEW"), boundaryController.getBoundary);
router.put(
  "/",
  requirePermission("boundary", "EDIT"),
  validate(updateBoundarySchema),
  boundaryController.updateBoundary,
);

export default router;
