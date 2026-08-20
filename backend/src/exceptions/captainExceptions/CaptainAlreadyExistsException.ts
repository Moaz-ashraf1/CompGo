import { StatusCodes } from "http-status-codes";
import { AppException } from "./AppException.js";

export class CaptainAlreadyExistsException extends AppException {
  constructor() {
    super("Captain already exists", StatusCodes.CONFLICT);
  }
}