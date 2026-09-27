import * as bonusTierRepo from "./bonus-tier.repository.js";
import { BonusTierNotFoundError } from "../../exceptions/bonus-tier.exceptions.js";
import type {
  CreateBonusTierDto,
  UpdateBonusTierDto,
} from "./bonus-tier.validation.js";

export const getAllBonusTiers = async () => {
  return bonusTierRepo.findAllBonusTiers();
};

export const createBonusTier = async (data: CreateBonusTierDto) => {
  return bonusTierRepo.createBonusTier(data);
};

export const updateBonusTier = async (
  id: string,
  data: UpdateBonusTierDto,
) => {
  const existing = await bonusTierRepo.findBonusTierById(id);
  if (!existing) throw new BonusTierNotFoundError();

  return bonusTierRepo.updateBonusTier(id, data);
};

export const deleteBonusTier = async (id: string) => {
  const existing = await bonusTierRepo.findBonusTierById(id);
  if (!existing) throw new BonusTierNotFoundError();

  await bonusTierRepo.deleteBonusTier(id);
};
