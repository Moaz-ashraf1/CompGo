import { Router } from "express";
import * as boundaryController from "./compound-boundary.controller.js";
import { updateBoundarySchema } from "./compound-boundary.validation.js";
import { validate } from "../../middlewares/validation.middleware.js";

const router = Router();

router.get("/", boundaryController.getBoundary);
router.put("/", validate(updateBoundarySchema), boundaryController.updateBoundary);

export default router;