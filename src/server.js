import dotenv from "dotenv";
import { Cache } from "file-system-cache";
import mongoose from "mongoose";
import HttpServer from "./services/server/http-server-service.js";
import WebsocketServer from "./services/server/websocket-server-service.js";

/* cwd: Current Working Directory, yani projenin başlangıç noktası. */
dotenv.config({ path: process.cwd() + "/.env" });

(async () => {
  try {
    const services = {
      mongoConnection: null,
      httpServerService: null,
      websocketService: null,
      cache: new Cache({
        basePath: "./.cache", // (optional) Path where cache files are stored (default).
        ns: "app", // (optional) A grouping namespace for items.
        hash: "sha1", // (optional) A hashing algorithm used within the cache key.
        ttl: 60, // (optional) A time-to-live (in secs) on how long an item remains cached.
      }),
    };

    console.log("Trying to connect mongodb.");
    const mongoConnection = await mongoose.connect(
      process.env.MONGODB_CONNECTION,
      {
        dbName: process.env.DB_NAME,
        autoCreate: true,
        socketTimeoutMS: 5_000,
      }
    );
    console.log("Mongodb connected.");
    services.mongoConnection = mongoConnection;

    const httpServerService = new HttpServer(services);
    await httpServerService.start();
    services.httpServerService = httpServerService;

    const websocketService = new WebsocketServer(services);
    await websocketService.start();
    services.websocketService = websocketService;

    // TODO Move websocket server to another service.
  } catch (err) {
    console.error(">> An error occured", err);
  }
})();

// Burası senkron bölge
