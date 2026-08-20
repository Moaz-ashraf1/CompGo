import { StatusCodes } from "http-status-codes";
import { AppException } from "./AppException.js";

export class CaptainAlreadyExistsException extends AppException {
  constructor(message = "Captain already exists") {
    super(message, StatusCodes.CONFLICT);
  }
}

export class CaptainNotFoundException extends AppException {
  constructor() {
    super("Captain not found", StatusCodes.NOT_FOUND);
  }
}