import { Router } from "express";
import * as tripController from "./trip.controller.js";
import { authenticate, authorize } from "./../../middlewares/auth.js";
import { validate } from "./../../middlewares/validation.middleware.js";
import {
  createTripSchema,
  cancelTripSchema,
  rateTripSchema,
} from "./../trip/trip.validation.js";

const router = Router();

router.use(authenticate, authorize("CLIENT"));

router.post("/", validate(createTripSchema), tripController.requestTrip);
router.get("/", tripController.getMyTrips);
router.get("/:id", tripController.getTripById);
router.patch(
  "/:id/cancel",
  validate(cancelTripSchema),
  tripController.cancelTrip,
);
router.patch(
  "/:id/rate",
  validate(rateTripSchema),
  tripController.rateTrip,
);

export default router;
