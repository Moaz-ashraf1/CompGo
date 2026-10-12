import { prisma } from "../../config/prisma.js";
import type { FamilyLinkStatus, FamilyRelation } from "../../generated/prisma/client.js";

export const findClientByExactPhone = (phone: string) =>
  prisma.client.findUnique({
    where: { phone },
    select: { id: true, name: true, phone: true, gender: true, status: true },
  });

export const findClientsByIds = (ids: string[]) =>
  ids.length === 0
    ? Promise.resolve([])
    : prisma.client.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, phone: true, gender: true },
      });

/// A link between two clients in either direction.
export const findLinkBetween = (a: string, b: string) =>
  prisma.familyLink.findFirst({
    where: {
      OR: [
        { requesterId: a, targetId: b },
        { requesterId: b, targetId: a },
      ],
    },
  });

export const findLinkById = (id: string) =>
  prisma.familyLink.findUnique({ where: { id } });

export const createLink = (data: {
  requesterId: string;
  targetId: string;
  relation: FamilyRelation;
}) => prisma.familyLink.create({ data });

export const resetLinkToPending = (id: string, relation: FamilyRelation) =>
  prisma.familyLink.update({
    where: { id },
    data: { relation, status: "PENDING", respondedAt: null },
  });

export const setLinkStatus = (id: string, status: FamilyLinkStatus) =>
  prisma.familyLink.update({
    where: { id },
    data: { status, respondedAt: new Date() },
  });

export const deleteLink = (id: string) =>
  prisma.familyLink.delete({ where: { id } });

export const findLinksForClient = (clientId: string) =>
  prisma.familyLink.findMany({
    where: {
      OR: [{ requesterId: clientId }, { targetId: clientId }],
      status: { in: ["PENDING", "ACCEPTED"] },
    },
    orderBy: { createdAt: "desc" },
  });

export const findAcceptedLinksForClient = (clientId: string) =>
  prisma.familyLink.findMany({
    where: {
      OR: [{ requesterId: clientId }, { targetId: clientId }],
      status: "ACCEPTED",
    },
  });

export const findAllLinks = (status?: FamilyLinkStatus) =>
  prisma.familyLink.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    take: 500,
  });
