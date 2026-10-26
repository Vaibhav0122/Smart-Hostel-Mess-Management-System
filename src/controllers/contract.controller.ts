import { Request, Response, NextFunction } from "express";
import { ContractService } from "../services/contract.service";
import { HttpStatus } from "../constants/statusCodes";

export class ContractController {
  /**
   * POST /api/v1/contracts
   * Admin creates a new residency contract.
   */
  public static async createContract(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const contract = await ContractService.createContract(
        req.user!,
        req.body,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(HttpStatus.CREATED).json({
        success: true,
        message: "Residency contract created successfully.",
        data: { contract },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/contracts
   * Admin lists contracts.
   */
  public static async listContracts(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const contracts = await ContractService.listContracts(req.query as any);
      res.status(HttpStatus.OK).json({
        success: true,
        data: { contracts },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/contracts/:id
   * Admin or resident gets contract by ID.
   */
  public static async getContractById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const contract = await ContractService.getContractById(
        req.user!,
        req.params.id
      );
      res.status(HttpStatus.OK).json({
        success: true,
        data: { contract },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/contracts/student/:studentId/history
   * Resident or admin gets student's contract history.
   */
  public static async getStudentContractHistory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const contracts = await ContractService.getStudentContractHistory(
        req.user!,
        req.params.studentId
      );
      res.status(HttpStatus.OK).json({
        success: true,
        data: { contracts },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/contracts/:id
   * Admin updates contract details.
   */
  public static async updateContract(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const contract = await ContractService.updateContract(
        req.user!,
        req.params.id,
        req.body,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(HttpStatus.OK).json({
        success: true,
        message: "Contract updated successfully.",
        data: { contract },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/contracts/:id/exit-request
   * Student initiates exit request on contract.
   */
  public static async requestExit(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const contract = await ContractService.requestExit(
        req.user!,
        req.params.id,
        req.body,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(HttpStatus.OK).json({
        success: true,
        message: "Exit request submitted successfully.",
        data: { contract },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/contracts/:id/approve-exit
   * Admin approves student exit request.
   */
  public static async approveExit(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const contract = await ContractService.approveExit(
        req.user!,
        req.params.id,
        req.body,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(HttpStatus.OK).json({
        success: true,
        message: "Residency contract exit approved successfully.",
        data: { contract },
      });
    } catch (error) {
      next(error);
    }
  }
}
