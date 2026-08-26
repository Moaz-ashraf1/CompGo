import { StatusCodes } from "http-status-codes";
import { AppException } from "./AppException.js";

export class InvalidCredentialsError extends AppException {
  constructor() {
    super("Invalid credentials", StatusCodes.UNAUTHORIZED);
  }
}
