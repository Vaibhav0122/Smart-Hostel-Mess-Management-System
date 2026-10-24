import { Request, Response, NextFunction } from "express";
import { SetupService } from "../services/setup.service";
import { HttpStatus } from "../constants/statusCodes";

export class SetupController {
  public static async setupInitialAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminUser = await SetupService.createInitialAdmin(req.body);

      res.status(HttpStatus.CREATED).json({
        success: true,
        message: "Initial super administrator account provisioned successfully. This setup endpoint is now permanently locked.",
        data: {
          admin: adminUser.toJSON(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getSetupStatus(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isCompleted = await SetupService.isSetupCompleted();

      res.status(HttpStatus.OK).json({
        success: true,
        data: {
          isSetupCompleted: isCompleted,
          status: isCompleted ? "LOCKED" : "PENDING_INITIAL_SETUP",
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
