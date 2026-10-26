import request from "supertest";
import app from "../app";

describe("Not Found Middleware (404 Handler)", () => {
  it("should return 404 with structured error envelope for non-existent GET route", async () => {
    const response = await request(app).get("/api/v1/non-existent-endpoint");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe("ROUTE_NOT_FOUND");
    expect(response.body.error.message).toContain("Cannot GET /api/v1/non-existent-endpoint");
  });

  it("should return 404 for arbitrary top-level unmatched path", async () => {
    const response = await request(app).post("/unknown-resource-path");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("ROUTE_NOT_FOUND");
    expect(response.body.error.message).toContain("Cannot POST /unknown-resource-path");
  });
});
