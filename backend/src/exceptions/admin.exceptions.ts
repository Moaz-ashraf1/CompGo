import { StatusCodes } from "http-status-codes";
import { AppException } from "./AppException.js";

export class InvalidCredentialsError extends AppException {
  constructor(message = "Invalid credentials") {
    super(message, StatusCodes.UNAUTHORIZED);
  }
}

export class AdminUsernameTakenError extends AppException {
  constructor() {
    super("Username is already taken", StatusCodes.CONFLICT);
  }
}

export class AdminNotFoundError extends AppException {
  constructor() {
    super("Admin not found", StatusCodes.NOT_FOUND);
  }
}

export class CannotModifySuperAdminError extends AppException {
  constructor() {
    super(
      "Super admins can't be edited or deleted from here",
      StatusCodes.FORBIDDEN,
    );
  }
}
