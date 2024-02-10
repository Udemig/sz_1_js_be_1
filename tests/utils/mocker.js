import { Cache } from "file-system-cache";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

export function reqMocker(body, params, headers) {
  return {
    body,
    params,
    headers,
  };
}

export function resMocker(json = null) {
  if (json === null) {
    json = (data) => {
      console.log(">> 🚀 data:", data);
    };
  }

  return {
    json,
  };
}

export function servicesMocker() {
  const cacheFolder = "./.cache/" + crypto.randomUUID();

  return {
    cache: new Cache({
      basePath: cacheFolder, // (optional) Path where cache files are stored (default).
      ns: "app", // (optional) A grouping namespace for items.
      hash: "sha1", // (optional) A hashing algorithm used within the cache key.
      ttl: 60, // (optional) A time-to-live (in secs) on how long an item remains cached.
    }),
  };
}

export async function mongoMocker() {
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  const mongoClient = await mongoose.connect(uri, {
    dbName: process.env.DB_NAME,
    autoCreate: true,
    socketTimeoutMS: 5_000,
  });

  return [mongoServer, mongoClient];
}
