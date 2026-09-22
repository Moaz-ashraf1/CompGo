import * as pricingRepo from "./pricing.repository.js";
import type { UpdatePricingDto } from "./pricing.validation.js";

export const getPricing = async () => {
  return pricingRepo.findPricingConfig();
};

/// A trimmed-down, client/captain-safe view - drops `commissionPercentage`
/// (that's the platform's own cut, not something riders/drivers need to
/// see) so a rider can preview a rough fare before requesting a trip.
export const getPublicPricing = async () => {
  const pricing = await pricingRepo.findPricingConfig();
  if (!pricing) return null;

  return {
    rideInsideCompoundPrice: pricing.rideInsideCompoundPrice,
    rideOutsidePricePerKm: pricing.rideOutsidePricePerKm,
    orderInsideCompoundPrice: pricing.orderInsideCompoundPrice,
    airportPrice: pricing.airportPrice,
    outsideCompoundMode: pricing.outsideCompoundMode,
    outsideCompoundFlatPrice: pricing.outsideCompoundFlatPrice,
    outsideCompoundBasePrice: pricing.outsideCompoundBasePrice,
    outsideCompoundThresholdKm: pricing.outsideCompoundThresholdKm,
    orderPlacesMode: pricing.orderPlacesMode,
    orderExtraPlacePrice: pricing.orderExtraPlacePrice,
    orderPlaceTiers: pricing.orderPlaceTiers,
  };
};

export const updatePricing = async (data: UpdatePricingDto) => {
  return pricingRepo.upsertPricingConfig(data);
};