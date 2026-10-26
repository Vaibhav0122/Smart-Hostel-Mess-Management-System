import { Router } from "express";
import multer from "multer";
import { StudentController } from "../controllers/student.controller";
import { validateRequest } from "../middlewares/validateRequest";
import { registerStudentSchema } from "../validations/student.validation";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware";

const router = Router();

// Multer configuration: store file in memory buffer for CSV parsing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      "text/csv",
      "text/plain",
      "application/csv",
      "application/vnd.ms-excel",
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only CSV files are accepted.`));
    }
  },
});

// POST /api/v1/students - Register a single student (Admin only)
router.post(
  "/",
  requireAuth,
  requirePermission("students:create"),
  validateRequest(registerStudentSchema),
  StudentController.registerStudent
);

// POST /api/v1/students/import-csv - Bulk import students from CSV (Admin only)
router.post(
  "/import-csv",
  requireAuth,
  requirePermission("students:import"),
  upload.single("file"),
  StudentController.importCsv
);

export default router;
