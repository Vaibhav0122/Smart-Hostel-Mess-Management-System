import { Request, Response } from "express";
import { getDatabaseStatus } from "../config/database";
import { HttpStatus } from "../constants/statusCodes";

export class HealthController {
  public static checkHealth(_req: Request, res: Response): void {
    const dbStatus = getDatabaseStatus();

    const healthData = {
      status: dbStatus.isConnected ? "HEALTHY" : "DEGRADED",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      database: {
        connected: dbStatus.isConnected,
        replicaSetEnabled: dbStatus.isReplicaSet,
        host: dbStatus.host,
        name: dbStatus.name,
      },
    };

    const statusCode = dbStatus.isConnected ? HttpStatus.OK : HttpStatus.INTERNAL_SERVER_ERROR;
    res.status(statusCode).json({
      success: dbStatus.isConnected,
      data: healthData,
    });
  }
}
