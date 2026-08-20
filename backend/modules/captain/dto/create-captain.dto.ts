import { Gender, VehicleType } from "../../../generated/prisma/client";

export interface CreateCaptainDto {
  name: string;
  phone: string;
  gender: Gender;

  nationalIdImage: string;
  licenseImage: string;

  vehicleNumber: string;
  vehicleType: VehicleType;
  vehicleModel: string;
}