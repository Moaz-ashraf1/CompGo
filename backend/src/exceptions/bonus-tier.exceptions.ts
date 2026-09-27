import { StatusCodes } from "http-status-codes";
import { AppException } from "./AppException.js";

export class BonusTierNotFoundError extends AppException {
  constructor() {
    super("Bonus tier not found", StatusCodes.NOT_FOUND);
  }
}
