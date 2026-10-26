import { Router } from "express";
import { HostelController } from "../controllers/hostel.controller";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validateRequest";
import {
  createRoomSchema,
  updateRoomSchema,
} from "../validations/hostel.validation";

const router = Router();

router.post(
  "/",
  requireAuth,
  requirePermission("rooms:manage"),
  validateRequest(createRoomSchema),
  HostelController.createRoom
);

router.get(
  "/",
  requireAuth,
  requirePermission("rooms:view"),
  HostelController.listRooms
);

router.get(
  "/:id",
  requireAuth,
  requirePermission("rooms:view"),
  HostelController.getRoomById
);

router.patch(
  "/:id",
  requireAuth,
  requirePermission("rooms:manage"),
  validateRequest(updateRoomSchema),
  HostelController.updateRoom
);

router.delete(
  "/:id",
  requireAuth,
  requirePermission("rooms:manage"),
  HostelController.deleteRoom
);

export default router;
