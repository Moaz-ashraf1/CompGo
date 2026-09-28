import { StatusCodes } from "http-status-codes";
import { AppException } from "./AppException.js";

export class SettlementAlreadyPendingError extends AppException {
  constructor() {
    super(
      "You already have a settlement submission awaiting review",
      StatusCodes.CONFLICT,
    );
  }
}

export class NoAmountDueError extends AppException {
  constructor() {
    super("You have no amount due to settle", StatusCodes.BAD_REQUEST);
  }
}

export class SettlementNotFoundError extends AppException {
  constructor() {
    super("Settlement submission not found", StatusCodes.NOT_FOUND);
  }
}

export class SettlementNotPendingError extends AppException {
  constructor() {
    super(
      "This settlement submission has already been reviewed",
      StatusCodes.CONFLICT,
    );
  }
}
