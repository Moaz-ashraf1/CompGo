import { prisma } from "../../config/prisma.js";
import type { CreateCaptainDto } from "./dto/create-captain.dto.js";

export const createCaptain = async (data:CreateCaptainDto)=>{
    return prisma.captain.create({
        data,
    })
}

export const findCaptainByPhone = async (phone: string) => {
  return prisma.captain.findUnique({
    where: {
      phone,
    },
    select: {
      id: true,
    },
  });
};


export const findCaptainByVehicleNumber = async (vehicleNumber:string)=>{
    return prisma.captain.findUnique({
    where: {
      vehicleNumber,
    },
    select: {
      id: true,
    },
  });
}