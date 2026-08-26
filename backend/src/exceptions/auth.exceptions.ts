import { StatusCodes } from "http-status-codes";
import { AppException } from "./AppException.js";

export class ClientAlreadyExistsError extends AppException {
  constructor(message = "Client account already exists") {
    super(message, StatusCodes.CONFLICT);
  }
}

export class InvalidRefreshTokenError extends AppException {
  constructor(message = "Invalid refresh token") {
    super(message, StatusCodes.UNAUTHORIZED);
  }
}

export class RefreshTokenExpiredError extends AppException {
  constructor(message = "Refresh token expired") {
    super(message, StatusCodes.UNAUTHORIZED);
  }
}

export class SessionCompromisedError extends AppException {
  constructor(message = "Session compromised, please login again") {
    super(message, StatusCodes.UNAUTHORIZED);
  }
}
