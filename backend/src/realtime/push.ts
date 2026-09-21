import { getMessaging } from "../config/firebase.js";
import * as deviceTokenRepo from "../modules/device-token/device-token.repository.js";
import { logger } from "../config/logger.js";

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/// Actually reaches a device even if the app is backgrounded/killed -
/// unlike the socket channel (realtime/socket.ts), which only works while
/// the app is open. Best-effort: a missing Firebase config, a send
/// failure, or an account with no registered device never throws - the
/// REST response the caller is building already carries the real result.
const sendToTokens = async (tokens: string[], payload: PushPayload) => {
  if (tokens.length === 0) return;

  const messaging = getMessaging();
  if (!messaging) return;

  try {
    const res = await messaging.sendEachForMulticast({
      tokens,
      notification: { title: payload.title, body: payload.body },
      data: payload.data,
    });

    const invalidTokens: string[] = [];
    res.responses.forEach((r, i) => {
      const code = r.error?.code;
      if (
        !r.success &&
        (code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token")
      ) {
        invalidTokens.push(tokens[i]!);
      }
    });
    if (invalidTokens.length > 0) {
      await deviceTokenRepo.removeInvalidTokens(invalidTokens);
    }
  } catch (error) {
    logger.error("Push notification send failed", {
      error: (error as Error).message,
    });
  }
};

export const pushToAccount = async (accountId: string, payload: PushPayload) => {
  const tokens = await deviceTokenRepo.findTokensByAccountId(accountId);
  await sendToTokens(
    tokens.map((t) => t.token),
    payload,
  );
};

export const pushToAllCaptains = async (payload: PushPayload) => {
  const tokens = await deviceTokenRepo.findAllCaptainTokens();
  await sendToTokens(
    tokens.map((t) => t.token),
    payload,
  );
};

export const pushToCaptains = async (
  captainIds: string[],
  payload: PushPayload,
) => {
  const tokens = await deviceTokenRepo.findCaptainTokensByIds(captainIds);
  await sendToTokens(
    tokens.map((t) => t.token),
    payload,
  );
};
