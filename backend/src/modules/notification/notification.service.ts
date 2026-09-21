import * as notificationRepo from "./notification.repository.js";
import * as captainRepo from "../captain/captain.repository.js";
import {
  emitToClient,
  emitToCaptain,
  emitToCaptainsBroadcast,
} from "../../realtime/socket.js";
import {
  pushToAccount,
  pushToAllCaptains,
  pushToCaptains,
} from "../../realtime/push.js";
import type { AccountRole } from "../../generated/prisma/client.js";

interface NotifyPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/// The single place a trip-lifecycle event turns into "the rider/captain
/// actually finds out": persists to the notification center (so it shows
/// up in "كل الإشعارات" even if push was never configured), pushes a live
/// `notification:new` over the socket for an instant badge update while
/// the app is open, and sends a real OS push for when it isn't.
export const notifyAccount = async (
  accountId: string,
  role: AccountRole,
  payload: NotifyPayload,
) => {
  const notification = await notificationRepo.createNotification({
    accountId,
    role,
    title: payload.title,
    body: payload.body,
    data: payload.data,
  });

  if (role === "CLIENT") {
    emitToClient(accountId, "notification:new", notification);
  } else if (role === "CAPTAIN") {
    emitToCaptain(accountId, "notification:new", notification);
  }

  void pushToAccount(accountId, payload);
};

export const notifyAllCaptains = async (payload: NotifyPayload) => {
  const captains = await captainRepo.findAllCaptainIds();
  await notificationRepo.createNotificationsForAccounts(
    captains.map((c) => c.id),
    {
      role: "CAPTAIN",
      title: payload.title,
      body: payload.body,
      data: payload.data,
    },
  );

  emitToCaptainsBroadcast("notification:new", payload);
  void pushToAllCaptains(payload);
};

/// Same as `notifyAllCaptains`, but only for FEMALE captains - used for a
/// `femaleCaptainOnly` trip so male captains never see a notification for
/// something they structurally can't accept (see trip.service.ts ->
/// requestTrip).
export const notifyFemaleCaptains = async (payload: NotifyPayload) => {
  const captains = await captainRepo.findFemaleCaptainIds();
  const ids = captains.map((c) => c.id);
  if (ids.length === 0) return;

  await notificationRepo.createNotificationsForAccounts(ids, {
    role: "CAPTAIN",
    title: payload.title,
    body: payload.body,
    data: payload.data,
  });

  for (const id of ids) {
    emitToCaptain(id, "notification:new", payload);
  }
  void pushToCaptains(ids, payload);
};

export const getNotifications = async (accountId: string) => {
  const [notifications, unreadCount] = await Promise.all([
    notificationRepo.findByAccountId(accountId),
    notificationRepo.countUnread(accountId),
  ]);
  return { notifications, unreadCount };
};

export const markRead = async (id: string, accountId: string) => {
  await notificationRepo.markRead(id, accountId);
};

export const markAllRead = async (accountId: string) => {
  await notificationRepo.markAllRead(accountId);
};
