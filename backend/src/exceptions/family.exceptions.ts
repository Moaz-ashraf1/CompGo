import { StatusCodes } from "http-status-codes";
import { AppException } from "./AppException.js";

// Shown to the client as-is in the app, so these are Arabic on purpose.
export class FamilyPersonNotFoundError extends AppException {
  constructor() {
    super("مفيش حد مسجل بالرقم ده", StatusCodes.NOT_FOUND);
  }
}

export class FamilySelfError extends AppException {
  constructor() {
    super("ده رقمك انت", StatusCodes.BAD_REQUEST);
  }
}

export class FamilyLinkExistsError extends AppException {
  constructor() {
    super("فيه ارتباط أو طلب بينكم بالفعل", StatusCodes.CONFLICT);
  }
}

export class FamilyLinkNotFoundError extends AppException {
  constructor() {
    super("الطلب مش موجود", StatusCodes.NOT_FOUND);
  }
}
