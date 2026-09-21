import * as tripService from "../modules/trip/trip.service.js";
import { logger } from "../config/logger.js";

const POLL_INTERVAL_MS = 60 * 1000;

/// A scheduled (e.g. airport) trip sits invisible to captains until it's
/// within its lead window (see trip.service.ts -> LEAD_WINDOW_MS) - this
/// is what actually crosses that window and dispatches it, since nothing
/// else ever re-checks a trip after it's created. Deliberately a plain
/// interval rather than a cron dependency: this only needs "roughly every
/// minute, for as long as the process is up", not calendar scheduling.
export const startScheduledTripDispatcher = () => {
  setInterval(() => {
    tripService.dispatchDueScheduledTrips().catch((error) => {
      logger.error("Scheduled trip dispatch failed", {
        error: (error as Error).message,
      });
    });
  }, POLL_INTERVAL_MS);
};
