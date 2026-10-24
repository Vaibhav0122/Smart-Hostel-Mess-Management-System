import mongoose from "mongoose";
import { env } from "./env";

export interface DatabaseStatus {
  isConnected: boolean;
  isReplicaSet: boolean;
  host?: string;
  name?: string;
}

let isReplicaSet = false;

export const connectDatabase = async (): Promise<void> => {
  try {
    mongoose.set("strictQuery", true);

    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: env.NODE_ENV !== "production", // Build indexes automatically in development
    });

    // Detect replica set support for multi-document ACID transactions
    try {
      if (conn.connection.db) {
        const adminDb = conn.connection.db.admin();
        const serverStatus = await adminDb.serverStatus();
        isReplicaSet = Boolean(serverStatus.repl && serverStatus.repl.setName);
      }
    } catch {
      // If serverStatus permissions are restricted or in standalone mode
      isReplicaSet = false;
    }

    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    if (isReplicaSet) {
      console.log("⚡ MongoDB Replica Set detected: Multi-document ACID transactions enabled.");
    } else {
      console.warn("⚠️  MongoDB running in Standalone mode: Replica Set not detected. Transactions will require a replica set in production.");
    }

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected. Attempting to reconnect...");
    });
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error);
    process.exit(1);
  }
};

export const getDatabaseStatus = (): DatabaseStatus => {
  return {
    isConnected: mongoose.connection.readyState === 1,
    isReplicaSet,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
  };
};

export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected gracefully.");
  }
};
