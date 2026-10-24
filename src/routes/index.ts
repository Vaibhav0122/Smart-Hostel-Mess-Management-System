import { Router } from "express";
import setupRoutes from "./setup.routes";
import healthRoutes from "./health.routes";

const router = Router();

// Mount modules
router.use("/health", healthRoutes);
router.use("/setup", setupRoutes);

export default router;
