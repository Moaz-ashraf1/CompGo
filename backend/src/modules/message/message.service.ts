import * as messageRepo from "./message.repository.js";
import * as tripRepo from "../trip/trip.repository.js";
import { emitToClient, emitToCaptain } from "../../realtime/socket.js";
import { notifyAccount } from "../notification/notification.service.js";
import type { AccountRole } from "../../generated/prisma/client.js";
import {
  TripNotFoundError,
  NotYourTripError,
  InvalidTripStatusError,
} from "../../exceptions/trip.exceptions.js";

const NOTIFICATION_PREVIEW_LENGTH = 60;

/// Confirms the caller is actually one of the two parties on this trip and
/// returns which side they're on - every message action needs this, so
/// it's not exposed past this module.
const resolveSender = async (
  tripId: string,
  senderId: string,
  senderRole: AccountRole,
) => {
  const trip = await tripRepo.findTripById(tripId);
  if (!trip) throw new TripNotFoundError();

  const isClient = senderRole === "CLIENT" && trip.clientId === senderId;
  const isCaptain = senderRole === "CAPTAIN" && trip.captainId === senderId;
  if (!isClient && !isCaptain) throw new NotYourTripError();

  // Chat only makes sense once the trip actually has two matched parties -
  // same tier as when phone numbers first become visible elsewhere.
  if (!trip.captainId) {
    throw new InvalidTripStatusError(
      "Chat is only available once a captain is assigned to the trip",
    );
  }

  return { trip, isClient };
};

export const sendMessage = async (
  tripId: string,
  senderId: string,
  senderRole: AccountRole,
  body: string,
) => {
  const { trip, isClient } = await resolveSender(tripId, senderId, senderRole);

  const message = await messageRepo.createMessage({
    tripId,
    senderId,
    senderRole,
    body,
  });

  const preview =
    body.length > NOTIFICATION_PREVIEW_LENGTH
      ? `${body.slice(0, NOTIFICATION_PREVIEW_LENGTH)}…`
      : body;

  if (isClient) {
    emitToCaptain(trip.captainId!, "message:new", message);
    void notifyAccount(trip.captainId!, "CAPTAIN", {
      title: "رسالة جديدة",
      body: preview,
      data: { tripId, type: "message:new" },
    });
  } else {
    emitToClient(trip.clientId, "message:new", message);
    void notifyAccount(trip.clientId, "CLIENT", {
      title: "رسالة جديدة",
      body: preview,
      data: { tripId, type: "message:new" },
    });
  }

  return message;
};

export const getMessages = async (
  tripId: string,
  userId: string,
  role: AccountRole,
) => {
  await resolveSender(tripId, userId, role);
  return messageRepo.findByTripId(tripId);
};
