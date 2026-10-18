import { logger } from "../config/logger.js";
import { blockOverdueCaptains } from "../modules/captain/autoBlock.service.js";

const POLL_INTERVAL_MS = 10 * 60 * 1000;

/// Plain interval like the scheduled-trip dispatcher - deadlines are in whole
/// days, so checking every ten minutes is plenty.
export const startOverdueCaptainBlocker = () => {
  const run = () =>
    blockOverdueCaptains().catch((error) => {
      logger.error("Overdue captain auto-block failed", {
        error: (error as Error).message,
      });
    });
  setTimeout(run, 30 * 1000);
  setInterval(run, POLL_INTERVAL_MS);
};
