import { Router } from "express";
import multer from "multer";
import { ProfileController } from "../controllers/profile.controller";
import {
  requireAuth,
  requirePermission,
  requireRole,
  verifyOwnershipOrAdmin,
} from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validateRequest";
import { UserRole } from "../constants/roles";
import {
  createProfileSchema,
  updateProfileSchema,
  updateOwnProfileSchema,
  uploadKycSchema,
} from "../validations/profile.validation";

const router = Router();

// Multer setup for optional KYC document upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
});

// GET /api/v1/profile/me - View own profile (Student or Admin)
router.get(
  "/me",
  requireAuth,
  requirePermission("profile:view_self"),
  ProfileController.getMyProfile
);

// PATCH /api/v1/profile/me - Student updates permitted self fields
router.patch(
  "/me",
  requireAuth,
  requirePermission("profile:update_self"),
  validateRequest(updateOwnProfileSchema),
  ProfileController.updateMyProfile
);

// POST /api/v1/profile/documents - Upload KYC document
router.post(
  "/documents",
  requireAuth,
  requirePermission("profile:upload_kyc"),
  upload.single("file"),
  validateRequest(uploadKycSchema),
  ProfileController.uploadKycDocument
);

// POST /api/v1/profile - Admin creates student profile
router.post(
  "/",
  requireAuth,
  requireRole(UserRole.HOSTEL_ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(createProfileSchema),
  ProfileController.createProfile
);

// GET /api/v1/profile - Admin lists student profiles
router.get(
  "/",
  requireAuth,
  requireRole(UserRole.HOSTEL_ADMIN, UserRole.SUPER_ADMIN),
  ProfileController.listProfiles
);

// GET /api/v1/profile/:userId - View profile by userId (self or admin)
router.get(
  "/:userId",
  requireAuth,
  verifyOwnershipOrAdmin("userId"),
  ProfileController.getProfileById
);

// PATCH /api/v1/profile/:userId - Admin updates student profile
router.patch(
  "/:userId",
  requireAuth,
  requireRole(UserRole.HOSTEL_ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(updateProfileSchema),
  ProfileController.updateProfileByAdmin
);

// PATCH /api/v1/profile/:userId/documents/:docId/verify - Admin verifies KYC
router.patch(
  "/:userId/documents/:docId/verify",
  requireAuth,
  requirePermission("profile:view_sensitive"),
  ProfileController.verifyKycDocument
);

export default router;
