import { StatusCodes } from "http-status-codes";
import { AppException } from "./AppException.js";

export class InvalidCredentialsError extends AppException {
  constructor() {
    super("Invalid credentials", StatusCodes.UNAUTHORIZED);
  }
}

export class PhoneAlreadyInUseError extends AppException {
  constructor(message = "This phone number is already in use") {
    super(message, StatusCodes.CONFLICT);
  }
}

export class ClientNotFoundError extends AppException {
  constructor(message = "Client not found") {
    super(message, StatusCodes.NOT_FOUND);
  }
}
