import { StatusCodes } from "http-status-codes";
import { AppException } from "./AppException.js";

export class InvalidCredentialsError extends AppException {
  constructor(message = "Invalid credentials") {
    super(message, StatusCodes.UNAUTHORIZED);
  }
}
