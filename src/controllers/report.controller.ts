import { Request, Response, NextFunction } from "express";
import { ReportService } from "../services/report.service";
import { HttpStatus } from "../constants/statusCodes";

export class ReportController {
  /**
   * GET /api/v1/reports/students
   */
  public static async getStudentReport(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = await ReportService.getStudentReport(req.query as any);
      res.status(HttpStatus.OK).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/reports/occupancy
   */
  public static async getOccupancyReport(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = await ReportService.getOccupancyReport(req.query as any);
      res.status(HttpStatus.OK).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/reports/finances
   */
  public static async getFinanceReport(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = await ReportService.getFinanceReport(req.query as any);
      res.status(HttpStatus.OK).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/reports/mess
   */
  public static async getMessReport(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = await ReportService.getMessReport(req.query as any);
      res.status(HttpStatus.OK).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/reports/export
   * Stream server-side generated CSV file attachment
   */
  public static async exportReportCsv(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { filename, csv } = await ReportService.exportReportCsv(req.query as any);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.status(HttpStatus.OK).send(csv);
    } catch (error) {
      next(error);
    }
  }
}
