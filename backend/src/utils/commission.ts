export type CommissionCategory =
  | "RIDE_INSIDE"
  | "RIDE_OUTSIDE"
  | "AIRPORT"
  | "ORDER";

export interface CommissionRule {
  mode: "FIXED" | "PERCENT";
  value: number;
  onTop: boolean;
}

export type CommissionRules = Partial<Record<CommissionCategory, CommissionRule>>;

const round2 = (n: number) => Math.round(n * 100) / 100;

/// Splits a trip's fare into what the client pays and the company's cut.
/// With a rule: FIXED is EGP, PERCENT is % of the fare; `onTop` adds the
/// cut to the fare instead of taking it out of it. Without a rule (or no
/// pricing at all) it falls back to the global `commissionPercentage`
/// taken out of the fare - the original behaviour.
export const splitFare = (
  fare: number,
  category: CommissionCategory,
  config: { commissionPercentage: unknown; commissionRules: unknown },
) => {
  const rule = (config.commissionRules as CommissionRules | null)?.[category];
  if (!rule) {
    const companyShare = round2(
      fare * (Number(config.commissionPercentage) / 100),
    );
    return { price: round2(fare), companyShare };
  }
  const companyShare = round2(
    rule.mode === "FIXED" ? rule.value : fare * (rule.value / 100),
  );
  return {
    price: round2(rule.onTop ? fare + companyShare : fare),
    companyShare,
  };
};

/// The company's cut of an already-saved trip: the amount fixed at request
/// time, or - for trips that predate that - the old percentage of price.
export const tripCompanyShare = (
  trip: { price: unknown; companyShare: unknown },
  commissionPercentage: unknown,
) =>
  trip.companyShare !== null && trip.companyShare !== undefined
    ? Number(trip.companyShare)
    : Number(trip.price) * (Number(commissionPercentage) / 100);
