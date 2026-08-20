import type { CreateCaptainDto } from "./dto/create-captain.dto.js";
import {
  createCaptain,
  findCaptainByPhone,
  findCaptainByVehicleNumber,
} from "./captain.repo.js";

export const registerCaptain = async (data: CreateCaptainDto) => {
  const existingCaptainByPhone = await findCaptainByPhone(data.phone);

  if (existingCaptainByPhone) {
    const error = new Error("Phone number is already registered") as any;
    error.statusCode = 409;
    throw error;
  }

  const existingCaptainByVehicleNumber =
    await findCaptainByVehicleNumber(data.vehicleNumber);

  if (existingCaptainByVehicleNumber) {
    const error = new Error("Vehicle number is already registered") as any;
    error.statusCode = 409;
    throw error;
  }

  const captain = await createCaptain(data);

  return captain;
};