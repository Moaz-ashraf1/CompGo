import { Router } from "express";
import * as tripController from "./trip.controller.js";
import * as messageController from "../../message/message.controller.js";
import { authenticate, authorize } from "../../../middlewares/auth.js";
import { validate } from "../../../middlewares/validation.middleware.js";
import { cancelTripSchema } from "../../trip/trip.validation.js";
import { sendMessageSchema } from "../../message/message.validation.js";

const router = Router();

router.use(authenticate, authorize("CAPTAIN"));

router.get("/available", tripController.getAvailableTrips);
router.get("/", tripController.getMyTrips);
router.patch("/:id/accept", tripController.acceptTrip);
router.patch("/:id/start", tripController.startTrip);
router.patch("/:id/complete", tripController.completeTrip);
router.patch(
  "/:id/cancel",
  validate(cancelTripSchema),
  tripController.cancelTrip,
);
router.get("/:id/messages", messageController.getMessages);
router.post(
  "/:id/messages",
  validate(sendMessageSchema),
  messageController.sendMessage,
);

export default router;
