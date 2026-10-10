import * as repo from "./admin-users.repository.js";
import { hashPassword } from "../../utils/hash.js";
import {
  InvalidCredentialsError,
  AdminUsernameTakenError,
  AdminNotFoundError,
  CannotModifySuperAdminError,
} from "../../exceptions/admin.exceptions.js";
import type {
  CreateAdminUserDTO,
  UpdateAdminUserDTO,
} from "./admin-users.validation.js";

export const getAll = () => repo.findAll();

export const getMe = async (adminId: string) => {
  const admin = await repo.findById(adminId);
  // 401 (not 404) so the dashboard signs a deleted admin out right away.
  if (!admin) throw new InvalidCredentialsError("Admin no longer exists");
  return admin;
};

export const createAdmin = async (data: CreateAdminUserDTO) => {
  if (await repo.findByUsername(data.username)) {
    throw new AdminUsernameTakenError();
  }
  return repo.create({
    username: data.username,
    passwordHash: await hashPassword(data.password),
    permissions: data.permissions,
  });
};

const getEditableOrThrow = async (id: string) => {
  const admin = await repo.findById(id);
  if (!admin) throw new AdminNotFoundError();
  if (admin.isSuper) throw new CannotModifySuperAdminError();
  return admin;
};

export const updateAdmin = async (id: string, data: UpdateAdminUserDTO) => {
  await getEditableOrThrow(id);
  return repo.update(id, {
    ...(data.password
      ? { passwordHash: await hashPassword(data.password) }
      : {}),
    ...(data.permissions ? { permissions: data.permissions } : {}),
  });
};

export const deleteAdmin = async (id: string) => {
  await getEditableOrThrow(id);
  await repo.remove(id);
};
