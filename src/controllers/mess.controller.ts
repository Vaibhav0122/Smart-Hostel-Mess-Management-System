import { Request, Response, NextFunction } from "express";
import { MessService } from "../services/mess.service";
import { HttpStatus } from "../constants/statusCodes";

export class MessController {
  /**
   * POST /api/v1/mess/menu
   * Admin/Staff creates a daily meal menu
   */
  public static async createMenu(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const menu = await MessService.createMenu(
        req.user!,
        req.body,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(HttpStatus.CREATED).json({
        success: true,
        message: "Menu created successfully.",
        data: { menu },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/mess/menu/:id
   * Admin/Staff updates an existing menu
   */
  public static async updateMenu(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const menu = await MessService.updateMenu(
        req.user!,
        req.params["id"]!,
        req.body,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(HttpStatus.OK).json({
        success: true,
        message: "Menu updated successfully.",
        data: { menu },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/mess/menu/:id
   * Admin/Staff removes a menu item
   */
  public static async deleteMenu(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await MessService.deleteMenu(
        req.user!,
        req.params["id"]!,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(HttpStatus.OK).json({
        success: true,
        message: "Menu deleted successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/mess/menu
   * Display upcoming menus (default: next 3 days)
   */
  public static async getMenus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const menus = await MessService.getMenus(req.user!, {
        hostelId: req.query["hostelId"] as string | undefined,
        startDate: req.query["startDate"] as string | undefined,
        days: req.query["days"] ? parseInt(req.query["days"] as string, 10) : 3,
      });
      res.status(HttpStatus.OK).json({
        success: true,
        data: { menus },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/mess/selection
   * Student selects lunch choice (DINE_IN vs TIFFIN) before cutoff
   */
  public static async selectMeal(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const selection = await MessService.selectMeal(
        req.user!,
        req.body,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(HttpStatus.OK).json({
        success: true,
        message: "Meal selection saved successfully.",
        data: { selection },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/mess/selection/me
   * Student views their own meal selection for date
   */
  public static async getMySelection(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const selection = await MessService.getMySelection(
        req.user!,
        req.query["mealDate"] as string | undefined
      );
      res.status(HttpStatus.OK).json({
        success: true,
        data: { selection },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/mess/selection/override
   * Authorized admin overrides student selection post-cutoff
   */
  public static async overrideSelection(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const selection = await MessService.overrideSelection(
        req.user!,
        req.body,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(HttpStatus.OK).json({
        success: true,
        message: "Meal selection overridden successfully.",
        data: { selection },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/mess/reports/daily-kitchen
   * Kitchen preparation report with confirmed counts and tiffin roster
   */
  public static async getDailyKitchenReport(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const report = await MessService.getDailyKitchenReport(
        req.query["hostelId"] as string,
        req.query["mealDate"] as string
      );
      res.status(HttpStatus.OK).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/mess/feedback
   * Student submits meal rating and taste/hygiene feedback
   */
  public static async submitFeedback(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const feedback = await MessService.submitFeedback(
        req.user!,
        req.body,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(HttpStatus.CREATED).json({
        success: true,
        message: "Feedback submitted successfully.",
        data: { feedback },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/mess/feedback
   * List feedback (Student: own; Admin/Staff: all with summary)
   */
  public static async listFeedback(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await MessService.listFeedback(req.user!, {
        hostelId: req.query["hostelId"] as string | undefined,
        mealDate: req.query["mealDate"] as string | undefined,
        mealType: req.query["mealType"] as string | undefined,
        startDate: req.query["startDate"] as string | undefined,
        endDate: req.query["endDate"] as string | undefined,
      });
      res.status(HttpStatus.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
