import { Router } from "express";
import { HostelController } from "../controllers/hostel.controller";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validateRequest";
import {
  createBuildingSchema,
  updateBuildingSchema,
} from "../validations/hostel.validation";

const router = Router();

router.post(
  "/",
  requireAuth,
  requirePermission("rooms:manage"),
  validateRequest(createBuildingSchema),
  HostelController.createBuilding
);

router.get(
  "/",
  requireAuth,
  requirePermission("rooms:view"),
  HostelController.listBuildings
);

router.get(
  "/:id",
  requireAuth,
  requirePermission("rooms:view"),
  HostelController.getBuildingById
);

router.patch(
  "/:id",
  requireAuth,
  requirePermission("rooms:manage"),
  validateRequest(updateBuildingSchema),
  HostelController.updateBuilding
);

router.delete(
  "/:id",
  requireAuth,
  requirePermission("rooms:manage"),
  HostelController.deleteBuilding
);

export default router;
