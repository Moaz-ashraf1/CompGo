import {prisma} from "../../config/prisma.js";
import type { UpdatePricingDto } from "./pricing.validation.js";

export const findPricingConfig = async()=>{
    return prisma.pricingConfig.findFirst({
        orderBy: {updatedAt: "desc"},
    })
}

export const upsertPricingConfig = async (data: UpdatePricingDto) => {
  const existing = await prisma.pricingConfig.findFirst();

  if (existing) {
    return prisma.pricingConfig.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.pricingConfig.create({ data });
};