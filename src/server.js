import dotenv from "dotenv";
import mongoose from "mongoose";
import NodeCache from "node-cache";
import HttpServer from "./services/server/http-server-service.js";
import WebsocketServer from "./services/server/websocket-server-service.js";

/* cwd: Current Working Directory, yani projenin başlangıç noktası. */
dotenv.config({
  path: process.cwd() + "/.env",
});

(async () => {
  // Burası asenkron bölge
  try {
    const services = {
      mongoConnection: null,
      httpServerService: null,
      websocketService: null,
      cache: new NodeCache(),
    };

    const mongoConnection = await mongoose.connect(
      process.env.MONGODB_CONNECTION,
      {
        dbName: process.env.DB_NAME,
        autoCreate: true,
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
