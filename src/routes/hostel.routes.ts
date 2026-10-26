import { Router } from "express";
import { HostelController } from "../controllers/hostel.controller";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validateRequest";
import {
  createHostelSchema,
  updateHostelSchema,
} from "../validations/hostel.validation";

const router = Router();

router.post(
  "/",
  requireAuth,
  requirePermission("rooms:manage"),
  validateRequest(createHostelSchema),
  HostelController.createHostel
);

router.get(
  "/",
  requireAuth,
  requirePermission("rooms:view"),
  HostelController.listHostels
);

router.get(
  "/:id",
  requireAuth,
  requirePermission("rooms:view"),
  HostelController.getHostelById
);

router.patch(
  "/:id",
  requireAuth,
  requirePermission("rooms:manage"),
  validateRequest(updateHostelSchema),
  HostelController.updateHostel
);

router.delete(
  "/:id",
  requireAuth,
  requirePermission("rooms:manage"),
  HostelController.deleteHostel
);

export default router;
