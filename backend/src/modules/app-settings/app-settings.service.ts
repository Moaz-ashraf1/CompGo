import * as appSettingsRepo from "./app-settings.repository.js";
import type { UpdateAppSettingsDto } from "./app-settings.validation.js";

export const getSettings = async () => {
  return appSettingsRepo.findAppSettings();
};

/// No trimming needed today (nothing sensitive on this row) but kept as
/// its own function - same shape as pricing.service.ts's getPublicPricing -
/// so a client/captain-only field never accidentally leaks later just
/// because it was added to the admin shape.
export const getPublicSettings = async () => {
  const settings = await appSettingsRepo.findAppSettings();
  return {
    supportWhatsappNumber: settings?.supportWhatsappNumber ?? null,
    supportEmail: settings?.supportEmail ?? null,
    instapayNumber: settings?.instapayNumber ?? null,
    vodafoneCashNumber: settings?.vodafoneCashNumber ?? null,
  };
};

export const updateSettings = async (data: UpdateAppSettingsDto) => {
  return appSettingsRepo.upsertAppSettings(data);
};
