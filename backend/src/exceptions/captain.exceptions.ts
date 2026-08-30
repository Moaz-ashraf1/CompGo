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

export class PhoneAlreadyInUseError extends AppException {
  constructor(message = "This phone number is already in use") {
    super(message, StatusCodes.CONFLICT);
  }
}

export class VehicleNumberAlreadyInUseError extends AppException {
  constructor(message = "This vehicle number is already registered") {
    super(message, StatusCodes.CONFLICT);
  }
}
