import { Router } from "express";
import { SetupController } from "../controllers/setup.controller";
import { validateRequest } from "../middlewares/validateRequest";
import { initialAdminSetupSchema } from "../validations/setup.validation";

const router = Router();

// GET /api/v1/setup/status
router.get("/status", SetupController.getSetupStatus);

// POST /api/v1/setup/initial-admin
router.post(
  "/initial-admin",
  validateRequest(initialAdminSetupSchema),
  SetupController.setupInitialAdmin
);

export default router;
