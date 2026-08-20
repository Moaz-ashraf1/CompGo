import { StatusCodes } from "http-status-codes";
import { AppException } from "./AppException.js";

export class CaptainNotFoundException extends AppException {
  constructor() {
    super("Captain not found", StatusCodes.NOT_FOUND);
  }
}