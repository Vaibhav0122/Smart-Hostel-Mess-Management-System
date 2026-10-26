export interface HealthDatabaseStatus {
  connected: boolean;
  replicaSetEnabled: boolean;
  host?: string;
  name?: string;
}

export interface HealthResponseData {
  status: "HEALTHY" | "DEGRADED";
  timestamp: string;
  uptimeSeconds: number;
  nodeVersion: string;
  database: HealthDatabaseStatus;
}

export interface HealthApiResponse {
  success: boolean;
  data: HealthResponseData;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

export async function fetchBackendHealth(): Promise<{
  data: HealthResponseData | null;
  error: string | null;
  latencyMs: number;
}> {
  const startTime = performance.now();
  try {
    const url = `${API_BASE_URL.replace(/\/$/, "")}/health`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const latencyMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      // Backend returned 500/503 (e.g. database degraded)
      try {
        const body = (await response.json()) as HealthApiResponse;
        if (body && body.data) {
          return { data: body.data, error: null, latencyMs };
        }
      } catch {
        // failed to parse JSON
      }
      return {
        data: null,
        error: `Backend responded with HTTP ${response.status} (${response.statusText})`,
        latencyMs,
      };
    }

    const payload = (await response.json()) as HealthApiResponse;
    return { data: payload.data, error: null, latencyMs };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    const message =
      err instanceof TypeError && err.message.includes("fetch")
        ? "Unable to reach backend API. Ensure the server is running on " + API_BASE_URL
        : err?.message || "An unknown network error occurred.";
    return { data: null, error: message, latencyMs };
  }
}
