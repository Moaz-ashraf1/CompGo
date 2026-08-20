import { z } from "zod";

export const createCaptainSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),

  phone: z
    .string()
    .regex(/^01[0125][0-9]{8}$/, "Invalid Egyptian phone number"),

  gender: z.enum(["MALE", "FEMALE"]),

  nationalIdImage: z
    .string()
    .url("National ID image must be a valid URL"),

  licenseImage: z
    .string()
    .url("License image must be a valid URL"),

  vehicleNumber: z
    .string()
    .min(2, "Vehicle number is required")
    .max(50),

  vehicleType: z.enum([
    "MOTORCYCLE",
    "CAR",
    "BICYCLE",
  ]),

  vehicleModel: z
    .string()
    .min(2, "Vehicle model is required")
    .max(100),
});

export type CreateCaptainInput = z.infer<typeof createCaptainSchema>;