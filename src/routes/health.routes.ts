import { Router } from "express";
import { HealthController } from "../controllers/health.controller";

const router = Router();

// GET /api/v1/health
router.get("/", HealthController.checkHealth);

export default router;
