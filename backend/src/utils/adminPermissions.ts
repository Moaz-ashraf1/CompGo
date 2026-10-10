export const ADMIN_SECTIONS = [
  "reports",
  "trips",
  "captains",
  "clients",
  "notifications",
  "wallet",
  "settlements",
  "pricing",
  "boundary",
  "settings",
] as const;

export type AdminSection = (typeof ADMIN_SECTIONS)[number];
export type PermissionLevel = "VIEW" | "EDIT";
export type AdminPermissions = Partial<Record<AdminSection, PermissionLevel>>;

/// EDIT implies VIEW.
export const hasPermission = (
  admin: { isSuper: boolean; permissions: unknown },
  section: AdminSection,
  level: PermissionLevel,
) => {
  if (admin.isSuper) return true;
  const granted = (admin.permissions as AdminPermissions | null)?.[section];
  if (!granted) return false;
  return level === "VIEW" || granted === "EDIT";
};
