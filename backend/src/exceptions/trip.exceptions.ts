import { StatusCodes } from "http-status-codes";
import { AppException } from "./AppException.js";

export class TripNotFoundError extends AppException {
  constructor() {
    super("Trip not found", StatusCodes.NOT_FOUND);
  }
}

export class NotYourTripError extends AppException {
  constructor() {
    super("This trip does not belong to you", StatusCodes.FORBIDDEN);
  }
}

export class InvalidTripStatusError extends AppException {
  constructor(
    message = "This action is not allowed for the trip's current status",
  ) {
    super(message, StatusCodes.BAD_REQUEST);
  }
}

export class TripAlreadyTakenError extends AppException {
  constructor() {
    super(
      "This trip has already been accepted by another captain",
      StatusCodes.CONFLICT,
    );
  }
}

export class MissingDropoffError extends AppException {
  constructor() {
    super(
      "dropoffLat and dropoffLng are required for rides outside the compound",
      StatusCodes.BAD_REQUEST,
    );
  }
}

export class OrderOutsideCompoundError extends AppException {
  constructor() {
    super(
      "Orders are only available inside the compound",
      StatusCodes.BAD_REQUEST,
    );
  }
}

export class NoCompoundBoundaryError extends AppException {
  constructor() {
    super("Compound boundary is not configured yet", StatusCodes.BAD_REQUEST);
  }
}

export class NoPricingConfigError extends AppException {
  constructor() {
    super("Pricing is not configured yet", StatusCodes.BAD_REQUEST);
  }
}
