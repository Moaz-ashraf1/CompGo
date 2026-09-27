/// A plain "YYYY-MM-DD" value is treated as end-of-day when `endOfDay` is
/// true, so a date-range "to" picked in the dashboard actually includes
/// the whole day instead of being excluded by a midnight cutoff.
export const parseDateParam = (value: unknown, endOfDay: boolean) => {
  if (typeof value !== "string" || value === "") return undefined;
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const parsed = new Date(
    isDateOnly && endOfDay ? `${value}T23:59:59.999` : value,
  );
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};
