import { Router } from "express";
import { HostelController } from "../controllers/hostel.controller";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validateRequest";
import { updateBedSchema } from "../validations/hostel.validation";

const router = Router();

router.get(
  "/",
  requireAuth,
  requirePermission("rooms:view"),
  HostelController.listBeds
);

router.get(
  "/:id",
  requireAuth,
  requirePermission("rooms:view"),
  HostelController.getBedById
);

router.patch(
  "/:id/status",
  requireAuth,
  requirePermission("rooms:manage"),
  validateRequest(updateBedSchema),
  HostelController.updateBedStatus
);

export default router;
