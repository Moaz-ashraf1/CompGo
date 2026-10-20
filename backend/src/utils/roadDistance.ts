import { logger } from "../config/logger.js";
import { tryConsumeDaily } from "./dailyLimit.js";
import { haversineDistanceKm, type GeoPoint } from "./geo.js";

/// Driving distance used for trip fares, best source first:
///   1. Google Routes API (matches Google Maps) - when GOOGLE_MAPS_API_KEY is set
///   2. self-hosted OSRM (OSRM_URL, see OSRM.md)
///   3. straight-line distance
/// Each step is tried only if the one before it is unconfigured or failed, so a
/// routing outage never blocks a trip request.
const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY;
// Overridable for tests only.
const GOOGLE_ROUTES_URL =
  process.env.GOOGLE_ROUTES_URL ??
  "https://routes.googleapis.com/directions/v2:computeRoutes";
// Our own daily cap on paid Google calls - keeps the bill at zero (the first
// 10,000 requests a month are free). Past it we just use OSRM.
const GOOGLE_DAILY_LIMIT = Number(process.env.GOOGLE_ROUTES_DAILY_LIMIT) || 300;
const OSRM_URL = process.env.OSRM_URL;
const TIMEOUT_MS = 2500;

const warn = (what: string, err: unknown) =>
  logger.warn(`${what} failed, trying the next distance source`, {
    error: err instanceof Error ? err.message : String(err),
  });

/// Asks only for `distanceMeters` and uses TRAFFIC_UNAWARE routing - the
/// cheapest (Essentials) Routes SKU, no live-traffic pricing.
const googleDistanceKm = async (
  from: GeoPoint,
  to: GeoPoint,
): Promise<number | null> => {
  if (!GOOGLE_KEY) return null;
  if (!(await tryConsumeDaily("google_routes", GOOGLE_DAILY_LIMIT))) {
    logger.warn("Google Routes daily limit reached, using OSRM", {
      limit: GOOGLE_DAILY_LIMIT,
    });
    return null;
  }
  try {
    const res = await fetch(GOOGLE_ROUTES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_KEY,
        "X-Goog-FieldMask": "routes.distanceMeters",
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: from.lat, longitude: from.lng } } },
        destination: { location: { latLng: { latitude: to.lat, longitude: to.lng } } },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_UNAWARE",
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as { routes?: { distanceMeters?: number }[] };
    const meters = body.routes?.[0]?.distanceMeters;
    if (typeof meters !== "number") throw new Error("no route in response");
    return meters / 1000;
  } catch (err) {
    warn("Google Routes lookup", err);
    return null;
  }
};

const osrmDistanceKm = async (
  from: GeoPoint,
  to: GeoPoint,
): Promise<number | null> => {
  if (!OSRM_URL) return null;
  try {
    const res = await fetch(
      `${OSRM_URL}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`,
      { signal: AbortSignal.timeout(TIMEOUT_MS) },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as {
      code?: string;
      routes?: { distance: number }[];
    };
    const meters = body.routes?.[0]?.distance;
    if (body.code !== "Ok" || typeof meters !== "number") {
      throw new Error("no route in response");
    }
    return meters / 1000;
  } catch (err) {
    warn("OSRM route lookup", err);
    return null;
  }
};

export const getDrivingDistanceKm = async (
  from: GeoPoint,
  to: GeoPoint,
): Promise<number> =>
  (await googleDistanceKm(from, to)) ??
  (await osrmDistanceKm(from, to)) ??
  haversineDistanceKm(from, to);
