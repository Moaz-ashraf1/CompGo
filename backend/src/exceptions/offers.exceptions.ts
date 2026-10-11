import { StatusCodes } from "http-status-codes";
import { AppException } from "./AppException.js";

// These messages are shown to the client as-is in the app, so they're in
// Arabic on purpose.
export class PromoCodeInvalidError extends AppException {
  constructor(message = "كود الخصم غير صحيح") {
    super(message, StatusCodes.BAD_REQUEST);
  }
}

export class InsufficientCreditError extends AppException {
  constructor() {
    super("رصيدك مش كافي", StatusCodes.BAD_REQUEST);
  }
}

export class PromoCodeNotFoundError extends AppException {
  constructor() {
    super("Promo code not found", StatusCodes.NOT_FOUND);
  }
}

export class PromoCodeTakenError extends AppException {
  constructor() {
    super("A promo code with this name already exists", StatusCodes.CONFLICT);
  }
}

export class ClientNotFoundForGrantError extends AppException {
  constructor() {
    super("No client found with this phone number", StatusCodes.NOT_FOUND);
  }
}
