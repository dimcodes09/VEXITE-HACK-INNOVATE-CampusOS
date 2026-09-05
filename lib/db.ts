import dns from "node:dns";
import mongoose from "mongoose";

const WINDOWS_ATLAS_DNS_SERVERS = ["1.1.1.1", "1.0.0.1"];

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = global as typeof globalThis & {
  mongoose?: MongooseCache;
};

const cached = globalWithMongoose.mongoose ?? {
  conn: null,
  promise: null
};

globalWithMongoose.mongoose = cached;

export async function connectToDatabase(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Please define the MONGODB_URI environment variable.");
  }

  // Node's c-ares SRV resolver is refused by the local Windows DNS path, while
  // the same Atlas record resolves through these public resolvers. This affects
  // only mongodb+srv connections on Windows; Atlas TLS remains enabled.
  if (process.platform === "win32" && uri.startsWith("mongodb+srv://")) {
    dns.setServers(WINDOWS_ATLAS_DNS_SERVERS);
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}
