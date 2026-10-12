import * as repo from "./family.repository.js";
import { notifyAccount } from "../notification/notification.service.js";
import {
  FamilyLinkExistsError,
  FamilyLinkNotFoundError,
  FamilyPersonNotFoundError,
  FamilySelfError,
} from "../../exceptions/family.exceptions.js";
import {
  inverseRelation,
  maskPhone,
  relationLabel,
  watchPairs,
  watchViewFor,
} from "./family.logic.js";
import type { FamilyLinkStatus, FamilyRelation } from "../../generated/prisma/client.js";

const notify = (clientId: string, title: string, body: string, type: string) =>
  void notifyAccount(clientId, "CLIENT", { title, body, data: { type } });

// ---------------------------------------------------------------- search

/// Exact phone match only - typing part of a number must not reveal who
/// else is registered.
export const search = async (clientId: string, rawPhone: string) => {
  const phone = rawPhone.trim();
  const found = await repo.findClientByExactPhone(phone);
  if (!found || found.status === "BLOCKED") throw new FamilyPersonNotFoundError();
  if (found.id === clientId) throw new FamilySelfError();

  const link = await repo.findLinkBetween(clientId, found.id);
  let state: "NONE" | "PENDING_OUT" | "PENDING_IN" | "LINKED" = "NONE";
  if (link?.status === "ACCEPTED") state = "LINKED";
  else if (link?.status === "PENDING") {
    state = link.requesterId === clientId ? "PENDING_OUT" : "PENDING_IN";
  }
  return { id: found.id, name: found.name, phone: maskPhone(found.phone), state };
};

// -------------------------------------------------------------- requests

/// What the notification tells the target about following/being followed.
const consentNote = (
  link: { requesterId: string; targetId: string; relation: FamilyRelation },
  targetId: string,
) => {
  const view = watchViewFor(link, targetId);
  if (view === "MUTUAL") return " - هتوصلكم إشعارات رحلات بعض";
  if (view === "WATCHES_ME") return " - هيوصله إشعارات رحلاتك";
  if (view === "I_WATCH") return " - هتوصلك إشعارات رحلاته";
  return "";
};

export const sendRequest = async (
  clientId: string,
  targetId: string,
  relation: FamilyRelation,
) => {
  if (targetId === clientId) throw new FamilySelfError();
  const [target] = await repo.findClientsByIds([targetId]);
  const [me] = await repo.findClientsByIds([clientId]);
  if (!target || !me) throw new FamilyPersonNotFoundError();

  const existing = await repo.findLinkBetween(clientId, targetId);
  let link;
  if (existing) {
    if (existing.status !== "REJECTED") throw new FamilyLinkExistsError();
    // A previously declined request can be sent again.
    if (existing.requesterId === clientId) {
      link = await repo.resetLinkToPending(existing.id, relation);
    } else {
      await repo.deleteLink(existing.id);
      link = await repo.createLink({ requesterId: clientId, targetId, relation });
    }
  } else {
    link = await repo.createLink({ requesterId: clientId, targetId, relation });
  }

  notify(
    targetId,
    "طلب ارتباط عائلي",
    `${me.name} عايز يضيفك ك${relationLabel(relation)} ليه${consentNote(link, targetId)}`,
    "family:request",
  );
  return { id: link.id };
};

export const respond = async (clientId: string, linkId: string, accept: boolean) => {
  const link = await repo.findLinkById(linkId);
  if (!link || link.targetId !== clientId || link.status !== "PENDING") {
    throw new FamilyLinkNotFoundError();
  }
  await repo.setLinkStatus(linkId, accept ? "ACCEPTED" : "REJECTED");

  const [me] = await repo.findClientsByIds([clientId]);
  notify(
    link.requesterId,
    accept ? "تم قبول طلبك" : "تم رفض طلبك",
    accept
      ? `${me?.name ?? "الشخص"} وافق على الارتباط العائلي`
      : `${me?.name ?? "الشخص"} رفض طلب الارتباط`,
    accept ? "family:accepted" : "family:rejected",
  );
};

/// Either side can undo the link at any time; cancelling your own pending
/// request is silent, ending an accepted one tells the other person.
export const remove = async (clientId: string, linkId: string) => {
  const link = await repo.findLinkById(linkId);
  if (!link || (link.requesterId !== clientId && link.targetId !== clientId)) {
    throw new FamilyLinkNotFoundError();
  }
  await repo.deleteLink(linkId);

  if (link.status === "ACCEPTED") {
    const otherId = link.requesterId === clientId ? link.targetId : link.requesterId;
    const [me] = await repo.findClientsByIds([clientId]);
    notify(
      otherId,
      "تم فك الارتباط العائلي",
      `${me?.name ?? "حد من عيلتك"} فك الارتباط بينكم`,
      "family:removed",
    );
  }
};

// ------------------------------------------------------------------ list

export const list = async (clientId: string) => {
  const links = await repo.findLinksForClient(clientId);
  const people = await repo.findClientsByIds([
    ...new Set(links.flatMap((l) => [l.requesterId, l.targetId])),
  ]);
  const byId = new Map(people.map((p) => [p.id, p]));

  const shape = (l: (typeof links)[number]) => {
    const iAmRequester = l.requesterId === clientId;
    const other = byId.get(iAmRequester ? l.targetId : l.requesterId);
    const requester = byId.get(l.requesterId);
    // What the OTHER person is to me.
    const relation = iAmRequester
      ? l.relation
      : inverseRelation(l.relation, requester?.gender ?? "MALE");
    return {
      id: l.id,
      person: {
        id: other?.id ?? "",
        name: other?.name ?? "مستخدم محذوف",
        phone: maskPhone(other?.phone ?? ""),
      },
      relation,
      relationLabel: relationLabel(relation),
      watch: watchViewFor(l, clientId),
      createdAt: l.createdAt,
    };
  };

  return {
    incoming: links.filter((l) => l.status === "PENDING" && l.targetId === clientId).map(shape),
    outgoing: links.filter((l) => l.status === "PENDING" && l.requesterId === clientId).map(shape),
    members: links.filter((l) => l.status === "ACCEPTED").map(shape),
  };
};

// --------------------------------------------------------- trip watching

const TYPE_NOUN: Record<string, string> = {
  RIDE: "رحلة",
  ORDER: "توصيل طلب",
  AIRPORT: "رحلة مطار",
};

export type FamilyTripEvent =
  | { kind: "requested"; type: string; dropoffLabel?: string | null }
  | { kind: "accepted"; captainName: string; vehicle: string }
  | { kind: "started" }
  | { kind: "completed" }
  | { kind: "cancelled" };

const describe = (name: string, event: FamilyTripEvent) => {
  switch (event.kind) {
    case "requested":
      return {
        title: "طلب رحلة جديد",
        body: `${name} طلب ${TYPE_NOUN[event.type] ?? "رحلة"}${event.dropoffLabel ? ` إلى ${event.dropoffLabel}` : ""}`,
      };
    case "accepted":
      return {
        title: "كابتن قبل الرحلة",
        body: `${name}: الكابتن ${event.captainName}${event.vehicle ? ` (${event.vehicle})` : ""} في الطريق`,
      };
    case "started":
      return { title: "الرحلة بدأت", body: `رحلة ${name} بدأت` };
    case "completed":
      return { title: "الرحلة خلصت", body: `رحلة ${name} خلصت بسلام` };
    case "cancelled":
      return { title: "الرحلة اتلغت", body: `رحلة ${name} اتلغت` };
  }
};

/// Tells everyone who follows this client about a step of their trip.
/// Best-effort and deliberately without the trip id: a follower can't open
/// someone else's trip, so tapping the notification must not try to.
export const notifyWatchers = async (clientId: string, event: FamilyTripEvent) => {
  try {
    const links = await repo.findAcceptedLinksForClient(clientId);
    const watcherIds = [
      ...new Set(
        links
          .flatMap(watchPairs)
          .filter((p) => p.watchedId === clientId)
          .map((p) => p.watcherId),
      ),
    ];
    if (watcherIds.length === 0) return;
    const [me] = await repo.findClientsByIds([clientId]);
    const { title, body } = describe(me?.name ?? "حد من عيلتك", event);
    watcherIds.forEach((id) => notify(id, title, body, "family:trip"));
  } catch {
    // Never let a family notification break the trip itself.
  }
};

// ----------------------------------------------------------------- admin

export const adminList = async (params: { status?: FamilyLinkStatus; search?: string }) => {
  const links = await repo.findAllLinks(params.status);
  const people = await repo.findClientsByIds([
    ...new Set(links.flatMap((l) => [l.requesterId, l.targetId])),
  ]);
  const byId = new Map(people.map((p) => [p.id, p]));
  const term = params.search?.trim().toLowerCase();

  return links
    .map((l) => {
      const requester = byId.get(l.requesterId);
      const target = byId.get(l.targetId);
      const pairs = watchPairs(l);
      return {
        id: l.id,
        status: l.status,
        relation: l.relation,
        relationLabel: relationLabel(l.relation),
        requester: requester && { id: requester.id, name: requester.name, phone: requester.phone },
        target: target && { id: target.id, name: target.name, phone: target.phone },
        watching: pairs.map((p) => ({
          watcher: byId.get(p.watcherId)?.name ?? "—",
          watched: byId.get(p.watchedId)?.name ?? "—",
        })),
        createdAt: l.createdAt,
        respondedAt: l.respondedAt,
      };
    })
    .filter(
      (l) =>
        !term ||
        [l.requester?.name, l.requester?.phone, l.target?.name, l.target?.phone]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(term)),
    );
};

export const adminRemove = async (linkId: string) => {
  const link = await repo.findLinkById(linkId);
  if (!link) throw new FamilyLinkNotFoundError();
  await repo.deleteLink(linkId);
};
