import { prisma } from "../../../config/prisma.js";

export const findUserByPhone = async (phone: string) => {
  return prisma.user.findUnique({
    where: {
      phone,
    },
    include: {
      client: true,
    },
  });
};

export const createUserWithClient = async (data: {
  name: string;
  phone: string;
  gender: "MALE" | "FEMALE";
  passwordHash: string;
}) => {
  return prisma.user.create({
    data: {
      name: data.name,
      phone: data.phone,
      gender: data.gender,

      client: {
        create: {
          passwordHash: data.passwordHash,
        },
      },
    },

    include: {
      client: true,
    },
  });
};

export const createClientForExistingUser = async (
  userId: string,
  passwordHash: string,
) => {
  return prisma.client.create({
    data: {
      userId,
      passwordHash,
    },
  });
};
