import * as pricingRepo from "./pricing.repository.js";
import type { UpdatePricingDto } from "./pricing.validation.js";

export const getPricing = async () => {
  return pricingRepo.findPricingConfig();
};

export const updatePricing = async (data: UpdatePricingDto) => {
  return pricingRepo.upsertPricingConfig(data);
};