import type { AccountRole } from "../utils/jwt.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: AccountRole;
        familyId: string;
      };
    }
  }
}

export {};
