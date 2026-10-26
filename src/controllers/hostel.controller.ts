import { Request, Response, NextFunction } from "express";
import { HostelService } from "../services/hostel.service";
import { HttpStatus } from "../constants/statusCodes";

export class HostelController {
  // -------------------------------------------------------------------------
  // Hostels
  // -------------------------------------------------------------------------
  public static async createHostel(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const hostel = await HostelService.createHostel(
        req.user!,
        req.body,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(HttpStatus.CREATED).json({
        success: true,
        message: "Hostel created successfully.",
        data: { hostel },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async listHostels(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const hostels = await HostelService.listHostels(req.query as any);
      res.status(HttpStatus.OK).json({
        success: true,
        data: { hostels },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getHostelById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const hostel = await HostelService.getHostelById(req.params.id);
      res.status(HttpStatus.OK).json({
        success: true,
        data: { hostel },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateHostel(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const hostel = await HostelService.updateHostel(
        req.user!,
        req.params.id,
        req.body,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(HttpStatus.OK).json({
        success: true,
        message: "Hostel updated successfully.",
        data: { hostel },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteHostel(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await HostelService.deleteHostel(
        req.user!,
        req.params.id,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(HttpStatus.OK).json({
        success: true,
        message: "Hostel deleted successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  // -------------------------------------------------------------------------
  // Buildings
  // -------------------------------------------------------------------------
  public static async createBuilding(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const building = await HostelService.createBuilding(
        req.user!,
        req.body,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(HttpStatus.CREATED).json({
        success: true,
        message: "Building created successfully.",
        data: { building },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async listBuildings(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const buildings = await HostelService.listBuildings(req.query.hostelId as string);
      res.status(HttpStatus.OK).json({
        success: true,
        data: { buildings },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getBuildingById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const building = await HostelService.getBuildingById(req.params.id);
      res.status(HttpStatus.OK).json({
        success: true,
        data: { building },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateBuilding(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const building = await HostelService.updateBuilding(
        req.user!,
        req.params.id,
        req.body,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(HttpStatus.OK).json({
        success: true,
        message: "Building updated successfully.",
        data: { building },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteBuilding(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await HostelService.deleteBuilding(
        req.user!,
        req.params.id,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(HttpStatus.OK).json({
        success: true,
        message: "Building deleted successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  // -------------------------------------------------------------------------
  // Rooms
  // -------------------------------------------------------------------------
  public static async createRoom(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await HostelService.createRoom(
        req.user!,
        req.body,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(HttpStatus.CREATED).json({
        success: true,
        message: `Room created successfully with ${result.beds.length} beds.`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async listRooms(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const rooms = await HostelService.listRooms(req.query as any);
      res.status(HttpStatus.OK).json({
        success: true,
        data: { rooms },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getRoomById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await HostelService.getRoomById(req.params.id);
      res.status(HttpStatus.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateRoom(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const room = await HostelService.updateRoom(
        req.user!,
        req.params.id,
        req.body,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(HttpStatus.OK).json({
        success: true,
        message: "Room updated successfully.",
        data: { room },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteRoom(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await HostelService.deleteRoom(
        req.user!,
        req.params.id,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(HttpStatus.OK).json({
        success: true,
        message: "Room and its beds deleted successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  // -------------------------------------------------------------------------
  // Beds
  // -------------------------------------------------------------------------
  public static async listBeds(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const beds = await HostelService.listBeds(req.query as any);
      res.status(HttpStatus.OK).json({
        success: true,
        data: { beds },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getBedById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const bed = await HostelService.getBedById(req.params.id);
      res.status(HttpStatus.OK).json({
        success: true,
        data: { bed },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateBedStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const bed = await HostelService.updateBedStatus(
        req.user!,
        req.params.id,
        req.body.status,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(HttpStatus.OK).json({
        success: true,
        message: `Bed status updated to ${bed.status}.`,
        data: { bed },
      });
    } catch (error) {
      next(error);
    }
  }

  // -------------------------------------------------------------------------
  // Allocations
  // -------------------------------------------------------------------------
  public static async allocateBed(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await HostelService.allocateBed(
        req.user!,
        req.body,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(HttpStatus.CREATED).json({
        success: true,
        message: "Bed allocated successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async transferBed(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await HostelService.transferBed(
        req.user!,
        req.body,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(HttpStatus.OK).json({
        success: true,
        message: "Student bed transferred successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async checkoutBed(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const allocation = await HostelService.checkoutBed(
        req.user!,
        req.body,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(HttpStatus.OK).json({
        success: true,
        message: "Student bed checkout completed successfully.",
        data: { allocation },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async listAllocations(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const allocations = await HostelService.listAllocations(req.query as any);
      res.status(HttpStatus.OK).json({
        success: true,
        data: { allocations },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getStudentAllocationHistory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const targetStudentId = req.params.studentId || req.user?.id;
      const history = await HostelService.getStudentAllocationHistory(targetStudentId!);
      res.status(HttpStatus.OK).json({
        success: true,
        data: { history },
      });
    } catch (error) {
      next(error);
    }
  }
}
