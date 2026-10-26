import { Request, Response, NextFunction } from "express";
import { DashboardService } from "../services/dashboard.service";
import { HttpStatus } from "../constants/statusCodes";

export class DashboardController {
  /**
   * GET /api/v1/dashboard/admin-metrics
   * Real-time executive KPI metrics for Admins and Accounts Managers
   */
  public static async getAdminMetrics(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const hostelId = req.query["hostelId"] as string | undefined;
      const metrics = await DashboardService.getAdminMetrics(hostelId);
      res.status(HttpStatus.OK).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/dashboard/student-summary
   * Authenticated student personal dashboard summary
   */
  public static async getStudentSummary(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // If admin specifies ?studentId=..., allow them to inspect that student; otherwise view self
      const targetUserId =
        req.user?.role !== "STUDENT" && req.query["studentId"]
          ? (req.query["studentId"] as string)
          : req.user!.id;

      const summary = await DashboardService.getStudentSummary(targetUserId);
      res.status(HttpStatus.OK).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }
}
