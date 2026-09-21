import { prisma } from "../../config/prisma.js";
import type { AccountRole } from "../../generated/prisma/client.js";

export const createMessage = async (data: {
  tripId: string;
  senderId: string;
  senderRole: AccountRole;
  body: string;
}) => {
  return prisma.message.create({ data });
};

export const findByTripId = async (tripId: string) => {
  return prisma.message.findMany({
    where: { tripId },
    orderBy: { createdAt: "asc" },
  });
};
