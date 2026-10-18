import { logger } from "../config/logger.js";
import { haversineDistanceKm, type GeoPoint } from "./geo.js";

/// Self-hosted OSRM routing server (see OSRM_URL in docker-compose*.yml).
/// Unset in local dev -> straight-line distance is used.
const OSRM_URL = process.env.OSRM_URL;
const OSRM_TIMEOUT_MS = 2500;

/// Driving distance in km along real roads (what Google Maps shows), or
/// null when routing is unavailable - callers fall back to the straight-line
/// distance so a routing outage never blocks a trip request.
const fetchRoadDistanceKm = async (
  from: GeoPoint,
  to: GeoPoint,
): Promise<number | null> => {
  if (!OSRM_URL) return null;
  try {
    const res = await fetch(
      `${OSRM_URL}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`,
      { signal: AbortSignal.timeout(OSRM_TIMEOUT_MS) },
    );
    if (!res.ok) return null;
    const body = (await res.json()) as {
      code?: string;
      routes?: { distance: number }[];
    };
    const meters = body.routes?.[0]?.distance;
    if (body.code !== "Ok" || typeof meters !== "number") return null;
    return meters / 1000;
  } catch (err) {
    logger.warn("OSRM route lookup failed, using straight-line distance", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
};

export const getDrivingDistanceKm = async (
  from: GeoPoint,
  to: GeoPoint,
): Promise<number> =>
  (await fetchRoadDistanceKm(from, to)) ?? haversineDistanceKm(from, to);
