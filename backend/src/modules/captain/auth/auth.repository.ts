import { prisma } from "../../../config/prisma.js";

export const findCaptainByPhone = async (phone: string) => {
  return prisma.captain.findUnique({ where: { phone } });
};

export const createCaptain = async (data: {
  name: string;
  phone: string;
  gender: "MALE" | "FEMALE";
  passwordHash: string;
  nationalIdImage: string;
  licenseImage: string;
  vehicleNumber: string;
  vehicleType: "MOTORCYCLE" | "CAR" | "BICYCLE";
  vehicleModel: string;
}) => {
  return prisma.captain.create({ data });
};
