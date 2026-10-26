import { Request, Response, NextFunction } from "express";
import { ProfileService } from "../services/profile.service";
import { HttpStatus } from "../constants/statusCodes";

export class ProfileController {
  /**
   * GET /api/v1/profile/me
   * Authenticated user views their own profile.
   */
  public static async getMyProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const profile = await ProfileService.getProfileByUserId(
        req.user!,
        req.user!.id
      );
      res.status(HttpStatus.OK).json({
        success: true,
        data: { profile },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/profile/:userId
   * Admin or user views profile by user ID.
   */
  public static async getProfileById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const profile = await ProfileService.getProfileByUserId(
        req.user!,
        req.params.userId
      );
      res.status(HttpStatus.OK).json({
        success: true,
        data: { profile },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/profile
   * Admin creates a student profile record.
   */
  public static async createProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const profile = await ProfileService.createProfile(
        req.user!,
        req.body,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(HttpStatus.CREATED).json({
        success: true,
        message: "Student profile created successfully.",
        data: { profile },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/profile/me
   * Student updates permitted fields in their own profile.
   */
  public static async updateMyProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const profile = await ProfileService.updateOwnProfile(
        req.user!,
        req.body,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(HttpStatus.OK).json({
        success: true,
        message: "Profile updated successfully.",
        data: { profile },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/profile/:userId
   * Admin updates a student profile.
   */
  public static async updateProfileByAdmin(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const profile = await ProfileService.updateProfileByAdmin(
        req.user!,
        req.params.userId,
        req.body,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(HttpStatus.OK).json({
        success: true,
        message: "Student profile updated successfully.",
        data: { profile },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/profile/documents
   * Student uploads a KYC document.
   */
  public static async uploadKycDocument(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const fileMeta = req.file
        ? {
            fileName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
          }
        : undefined;

      const doc = await ProfileService.uploadKycDocument(
        req.user!,
        req.body,
        fileMeta,
        req.ip,
        req.headers["user-agent"]
      );

      res.status(HttpStatus.CREATED).json({
        success: true,
        message: "KYC document uploaded successfully.",
        data: { document: doc },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/profile/:userId/documents/:docId/verify
   * Admin verifies an uploaded KYC document.
   */
  public static async verifyKycDocument(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const doc = await ProfileService.verifyKycDocument(
        req.user!,
        req.params.userId,
        req.params.docId,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(HttpStatus.OK).json({
        success: true,
        message: "KYC document verified successfully.",
        data: { document: doc },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/profile
   * Admin lists student profiles.
   */
  public static async listProfiles(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const profiles = await ProfileService.listProfiles(req.query as any);
      res.status(HttpStatus.OK).json({
        success: true,
        data: { profiles },
      });
    } catch (error) {
      next(error);
    }
  }
}
