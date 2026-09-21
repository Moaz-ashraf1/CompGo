import { cert, initializeApp, type App } from "firebase-admin/app";
import { getMessaging as getFirebaseMessaging, type Messaging } from "firebase-admin/messaging";
import { logger } from "./logger.js";

let app: App | null = null;
let initAttempted = false;

/// Lazy, best-effort init - reads the whole service account JSON from one
/// env var (FIREBASE_SERVICE_ACCOUNT) rather than a mounted file, so it
/// works the same in Docker as it does locally. Until that env var is set
/// (e.g. before the Firebase project is fully wired up), every push call
/// just silently no-ops instead of crashing the server.
const init = () => {
  if (initAttempted) return;
  initAttempted = true;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    logger.warn(
      "FIREBASE_SERVICE_ACCOUNT is not set - push notifications are disabled",
    );
    return;
  }

  try {
    const credentials = JSON.parse(raw);
    app = initializeApp({ credential: cert(credentials) });
    logger.info("Firebase Admin initialized - push notifications enabled");
  } catch (error) {
    logger.error("Failed to initialize Firebase Admin", {
      error: (error as Error).message,
    });
  }
};

export const getMessaging = (): Messaging | null => {
  init();
  return app ? getFirebaseMessaging(app) : null;
};
