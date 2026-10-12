import type { FamilyRelation } from "../../generated/prisma/client.js";

const LABELS: Record<FamilyRelation, string> = {
  FATHER: "أب",
  MOTHER: "أم",
  SON: "ابن",
  DAUGHTER: "بنت",
  HUSBAND: "زوج",
  WIFE: "زوجة",
  BROTHER: "أخ",
  SISTER: "أخت",
  OTHER: "قريب",
};

export const relationLabel = (relation: FamilyRelation) => LABELS[relation];

/// What the requester is to the target, given what the target is to the
/// requester ("he is my father" -> "I am his son/daughter").
export const inverseRelation = (
  relation: FamilyRelation,
  requesterGender: string,
): FamilyRelation => {
  const female = requesterGender === "FEMALE";
  switch (relation) {
    case "FATHER":
    case "MOTHER":
      return female ? "DAUGHTER" : "SON";
    case "SON":
    case "DAUGHTER":
      return female ? "MOTHER" : "FATHER";
    case "HUSBAND":
      return "WIFE";
    case "WIFE":
      return "HUSBAND";
    case "BROTHER":
    case "SISTER":
      return female ? "SISTER" : "BROTHER";
    default:
      return "OTHER";
  }
};

export interface WatchPair {
  watcherId: string;
  watchedId: string;
}

/// Who is notified about whose trips for an accepted link: a parent follows
/// their child, spouses follow each other, everyone else is only linked.
export const watchPairs = (link: {
  requesterId: string;
  targetId: string;
  relation: FamilyRelation;
}): WatchPair[] => {
  const { requesterId, targetId } = link;
  switch (link.relation) {
    case "FATHER":
    case "MOTHER":
      return [{ watcherId: targetId, watchedId: requesterId }];
    case "SON":
    case "DAUGHTER":
      return [{ watcherId: requesterId, watchedId: targetId }];
    case "HUSBAND":
    case "WIFE":
      return [
        { watcherId: targetId, watchedId: requesterId },
        { watcherId: requesterId, watchedId: targetId },
      ];
    default:
      return [];
  }
};

export type WatchView = "I_WATCH" | "WATCHES_ME" | "MUTUAL" | "NONE";

export const watchViewFor = (
  link: { requesterId: string; targetId: string; relation: FamilyRelation },
  me: string,
): WatchView => {
  const pairs = watchPairs(link);
  const iWatch = pairs.some((p) => p.watcherId === me);
  const watchesMe = pairs.some((p) => p.watchedId === me);
  if (iWatch && watchesMe) return "MUTUAL";
  if (iWatch) return "I_WATCH";
  if (watchesMe) return "WATCHES_ME";
  return "NONE";
};

export const maskPhone = (phone: string) =>
  phone.length > 6
    ? `${phone.slice(0, 3)}${"*".repeat(phone.length - 6)}${phone.slice(-3)}`
    : phone;
