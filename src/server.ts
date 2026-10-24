import app from "./app";
import { env } from "./config/env";
import { connectDatabase, disconnectDatabase } from "./config/database";

const startServer = async (): Promise<void> => {
  // 1. Establish database connection
  await connectDatabase();

  // 2. Start HTTP listener
  const server = app.listen(env.PORT, () => {
    console.log(`
🚀 ==============================================================
🏠 Smart Hostel & Mess Management System Backend API
🌍 Environment: ${env.NODE_ENV}
📡 Server URL:  http://localhost:${env.PORT}
🩺 Health Check: http://localhost:${env.PORT}${env.API_PREFIX}/health
🔐 Setup Route:  http://localhost:${env.PORT}${env.API_PREFIX}/setup/initial-admin
🚀 ==============================================================
    `);
  });

  // 3. Graceful Shutdown Handlers
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Commencing graceful shutdown...`);

    server.close(async () => {
      console.log("🔒 HTTP server closed.");
      await disconnectDatabase();
      console.log("👋 Process terminated cleanly.");
      process.exit(0);
    });

    // Force shutdown after 10 seconds if hanging connections persist
    setTimeout(() => {
      console.error("⚠️ Forced shutdown after timeout.");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  process.on("unhandledRejection", (reason: any) => {
    console.error("💥 Unhandled Rejection at Promise:", reason);
  });

  process.on("uncaughtException", (error: Error) => {
    console.error("💥 Uncaught Exception thrown:", error);
    process.exit(1);
  });
};

startServer();
