import request from "supertest";
import app from "../app";
import * as databaseModule from "../config/database";

// Mock the database module status
jest.mock("../config/database", () => {
  const originalModule = jest.requireActual("../config/database");
  return {
    ...originalModule,
    getDatabaseStatus: jest.fn(),
  };
});

describe("Health Check API Endpoints", () => {
  const mockedGetDatabaseStatus = databaseModule.getDatabaseStatus as jest.Mock;

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /", () => {
    it("should return 200 OK with root system welcome envelope", async () => {
      const response = await request(app).get("/");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: "Smart Hostel & Mess Management System API",
        version: "1.0.0",
        docs: "/api/v1/health",
      });
    });
  });

  describe("GET /api/v1/health", () => {
    it("should return 200 OK and HEALTHY status when database is connected", async () => {
      mockedGetDatabaseStatus.mockReturnValue({
        isConnected: true,
        isReplicaSet: true,
        host: "127.0.0.1:27017",
        name: "smart_hostel_db",
      });

      const response = await request(app).get("/api/v1/health");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.status).toBe("HEALTHY");
      expect(response.body.data.database).toEqual({
        connected: true,
        replicaSetEnabled: true,
        host: "127.0.0.1:27017",
        name: "smart_hostel_db",
      });
      expect(response.body.data.uptimeSeconds).toBeGreaterThanOrEqual(0);
      expect(response.body.data.nodeVersion).toBe(process.version);
      expect(typeof response.body.data.timestamp).toBe("string");
    });

    it("should return 500 and DEGRADED status when database is disconnected", async () => {
      mockedGetDatabaseStatus.mockReturnValue({
        isConnected: false,
        isReplicaSet: false,
      });

      const response = await request(app).get("/api/v1/health");

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.status).toBe("DEGRADED");
      expect(response.body.data.database.connected).toBe(false);
    });
  });
});
