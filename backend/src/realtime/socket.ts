import type { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { verifyAccessToken } from "../utils/jwt.js";
import { logger } from "../config/logger.js";

let io: SocketIOServer | null = null;

/// Real-time channel alongside the REST API, for events that used to only
/// be discoverable by polling: a captain seeing a brand-new trip request
/// without pulling to refresh, a client seeing their trip get
/// accepted/started/completed without waiting for the next poll tick, and
/// the captain's live location reaching the client immediately instead of
/// on its next 4s poll. REST stays the source of truth for every mutation
/// (accept/start/complete/cancel/location) - sockets only carry a
/// best-effort notification that something changed; a client that missed
/// an event (e.g. reconnecting) still gets the truth from its next REST
/// call.
export const initSocket = (httpServer: HttpServer) => {
  io = new SocketIOServer(httpServer, {
    // Mobile app traffic (Flutter's socket_io_client), not a
    // credentialed browser session - a permissive origin here doesn't
    // expose anything the REST API's own auth doesn't already guard.
    cors: { origin: "*" },
  });

  io.use((socket, next) => {
    const authToken = socket.handshake.auth?.["token"] as string | undefined;
    const headerToken = socket.handshake.headers.authorization?.replace(
      /^Bearer\s+/i,
      "",
    );
    const token = authToken ?? headerToken;

    if (!token) {
      next(new Error("Missing token"));
      return;
    }

    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    const role = socket.data.role as string;

    if (role === "CLIENT") {
      socket.join(`client:${userId}`);
    } else if (role === "CAPTAIN") {
      socket.join(`captain:${userId}`);
      socket.join("captains:broadcast");
    }

    logger.info("Socket connected", { userId, role });
    socket.on("disconnect", () => {
      logger.info("Socket disconnected", { userId, role });
    });
  });

  return io;
};

export const emitToClient = (
  clientId: string,
  event: string,
  payload: unknown,
) => {
  io?.to(`client:${clientId}`).emit(event, payload);
};

export const emitToCaptain = (
  captainId: string,
  event: string,
  payload: unknown,
) => {
  io?.to(`captain:${captainId}`).emit(event, payload);
};

export const emitToCaptainsBroadcast = (event: string, payload: unknown) => {
  io?.to("captains:broadcast").emit(event, payload);
};
