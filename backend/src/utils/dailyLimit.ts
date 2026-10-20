import { prisma } from "../config/prisma.js";

/// Today's date in Cairo - the day boundary for our own daily caps.
const cairoDay = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(new Date());

/// Atomically counts one use of `key` today and says whether it is still within
/// `limit`. The row is only incremented while under the limit, so concurrent
/// requests can never overshoot it. Fails closed: if the counter cannot be
/// read the call is refused, because this guards real money.
export const tryConsumeDaily = async (
  key: string,
  limit: number,
): Promise<boolean> => {
  try {
    const rows = await prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO "ApiUsage" ("key", "day", "count")
      VALUES (${key}, ${cairoDay()}, 1)
      ON CONFLICT ("key", "day")
      DO UPDATE SET "count" = "ApiUsage"."count" + 1
      WHERE "ApiUsage"."count" < ${limit}
      RETURNING "count"`;
    return rows.length > 0;
  } catch {
    return false;
  }
};
