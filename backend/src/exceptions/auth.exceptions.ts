import { StatusCodes } from "http-status-codes";
import { AppException } from "./AppException.js";
export class ClientAlreadyExistsError extends AppException {
  constructor(message = "Client account already exists") {
    super(message, StatusCodes.CONFLICT);
  }
}
