import * as pricingRepo from "./pricing.repository.js";
import type { UpdatePricingDto } from "./pricing.validation.js";
import { splitFare } from "../../utils/commission.js";

export const getPricing = async () => {
  return pricingRepo.findPricingConfig();
};

/// A trimmed-down, client/captain-safe view - drops `commissionPercentage`
/// (that's the platform's own cut, not something riders/drivers need to
/// see) so a rider can preview a rough fare before requesting a trip.
export const getPublicPricing = async () => {
  const pricing = await pricingRepo.findPricingConfig();
  if (!pricing) return null;

  // What the rider will actually pay for the flat-priced trip types -
  // includes the airport entry fee and any company share set to be added
  // on top of the fare (see utils/commission.ts).
  const clientPrice = (
    fare: unknown,
    category: "RIDE_INSIDE" | "AIRPORT" | "ORDER",
  ) => splitFare(Number(fare), category, pricing).price;

  return {
    rideInsideCompoundPrice: clientPrice(pricing.rideInsideCompoundPrice, "RIDE_INSIDE"),
    rideOutsidePricePerKm: pricing.rideOutsidePricePerKm,
    orderInsideCompoundPrice: clientPrice(pricing.orderInsideCompoundPrice, "ORDER"),
    orderOutsideCompoundPrice: pricing.orderOutsideCompoundPrice,
    airportPrice: clientPrice(
      Number(pricing.airportPrice) + Number(pricing.airportCardFee ?? 0),
      "AIRPORT",
    ),
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