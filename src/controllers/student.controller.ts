import { Request, Response, NextFunction } from "express";
import { StudentService } from "../services/student.service";
import { HttpStatus } from "../constants/statusCodes";
import { AppError } from "../errors/AppError";

export class StudentController {
  /**
   * POST /api/v1/students
   * Admin registers a single student account.
   */
  public static async registerStudent(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await StudentService.registerStudent(
        req.user!,
        req.body,
        req.ip,
        req.headers["user-agent"]
      );

      res.status(HttpStatus.CREATED).json({
        success: true,
        message: "Student account created successfully. Activation token generated.",
        data: {
          user: result.user,
          ...(result.devActivationToken
            ? { devActivationToken: result.devActivationToken }
            : {}),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/students/import-csv
   * Admin imports students from an uploaded CSV file.
   * Expects a multipart/form-data upload with field name "file".
   */
  public static async importCsv(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.file) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "CSV_FILE_REQUIRED",
          "A CSV file must be uploaded using the 'file' form field."
        );
      }

      // Validate MIME type
      const allowedMimeTypes = [
        "text/csv",
        "text/plain",
        "application/csv",
        "application/vnd.ms-excel",
      ];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "INVALID_FILE_TYPE",
          `Expected a CSV file. Received: ${req.file.mimetype}`
        );
      }

      const csvText = req.file.buffer.toString("utf-8");

      const result = await StudentService.importStudentsFromCsv(
        req.user!,
        csvText,
        req.ip,
        req.headers["user-agent"]
      );

      const statusCode =
        result.successCount > 0 ? HttpStatus.CREATED : HttpStatus.OK;

      res.status(statusCode).json({
        success: true,
        message: `CSV import complete. ${result.successCount} students created, ${result.errorCount} errors.`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
