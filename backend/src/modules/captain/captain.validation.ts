import { z } from "zod";

export const registerCaptainSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),

  phone: z
    .string()
    .regex(/^01[0125][0-9]{8}$/, "Invalid Egyptian phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),

  gender: z.enum(["MALE", "FEMALE"]),

  nationalIdImage: z.string().url("National ID image must be a valid URL"),

  licenseImage: z.string().url("License image must be a valid URL"),

  vehicleNumber: z.string().min(2, "Vehicle number is required").max(50),

  vehicleType: z.enum(["MOTORCYCLE", "CAR", "BICYCLE"]),

  vehicleModel: z.string().min(2, "Vehicle model is required").max(100),
});

export const loginCaptainSchema = z.object({
  phone: z
    .string()
    .regex(/^01[0125][0-9]{8}$/, "Invalid Egyptian phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type RegisterCaptainDTO = z.infer<typeof registerCaptainSchema>;
export type LoginCaptainDTO = z.infer<typeof loginCaptainSchema>;
