import * as boundaryRepo from "./compound-boundary.repository.js";
import type { UpdateBoundaryDto } from "./compound-boundary.validation.js";

export const getBoundary = async () => {
  return boundaryRepo.findBoundary();
};

export const updateBoundary = async (data: UpdateBoundaryDto) => {
  return boundaryRepo.upsertBoundary(data.points);
};