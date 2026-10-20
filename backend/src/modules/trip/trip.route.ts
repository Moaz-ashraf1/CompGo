import { Router } from "express";
import * as tripController from "./trip.controller.js";
import * as messageController from "../message/message.controller.js";
import { authenticate, authorize } from "./../../middlewares/auth.js";
import { validate } from "./../../middlewares/validation.middleware.js";
import {
  createTripSchema,
  cancelTripSchema,
  rateTripSchema,
} from "./../trip/trip.validation.js";
import { sendMessageSchema } from "../message/message.validation.js";

const router = Router();

router.use(authenticate, authorize("CLIENT"));

router.post("/", validate(createTripSchema), tripController.requestTrip);
router.get("/", tripController.getMyTrips);
// Before "/:id" so "location-check" is not read as a trip id.
router.get("/location-check", tripController.checkLocation);
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
router.get("/:id/messages", messageController.getMessages);
router.post(
  "/:id/messages",
  validate(sendMessageSchema),
  messageController.sendMessage,
);

export default router;
