import { StatusCodes } from "http-status-codes";
import { AppException } from "./AppException.js";

export class CaptainAlreadyExistsError extends AppException {
  constructor(message = "Captain already exists") {
    super(message, StatusCodes.CONFLICT);
  }
}

export class CaptainNotFoundError extends AppException {
  constructor() {
    super("Captain not found", StatusCodes.NOT_FOUND);
  }
}

export class InvalidCredentialsError extends AppException {
  constructor(message = "Invalid credentials") {
    super(message, StatusCodes.UNAUTHORIZED);
  }
}
