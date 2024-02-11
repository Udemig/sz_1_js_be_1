import cors from "cors";
import express from "express";
import { findAllControllerFiles } from "../../utils.js";

// fs: File System, dosya ve dizinlerle çalışmayı sağlar, nodejs'e gömülü gelir bu yüzden
// npm install yapmaya gerek yoktur.

export default class HttpServerService {
  httpServer = null;
  services = null;

  /* Nodejs her saniye durur ve bu durduğu süre boyunca çöp toplar. Çöp toplamak
  ne demek? Oluşturduğumuz her değişken, obje, json objesi, resource falan hepsini
  araştırır ve kullanılmayanları tespit eder ve hafızadan siler. */

  constructor(services) {
    console.log("Http server instance created.");
    this.services = services;
    this.httpServer = express();

    this.httpServer.use(express.json());
    this.httpServer.use(
      cors({ origin: process.env.CORS_ORIGIN, credentials: true })
    );

    this.httpServer.use(this.checkAuth.bind(this));

    // TODO Burası beklendiği gibi çalışmıyor, hataları yakalamıyor. Bunu araştır.
    this.httpServer.use(this.errorHandler.bind(this));
  }

  async errorHandler(err, req, res, next) {
    try {
      await next();
    } catch (e) {
      console.error("Exception captured in middleware: ", e);

      res.json({
        status: "error",
        errorMessage: e.message,
      });
    }
  }

  async checkAuth(req, res, next) {
    if (
      req.originalUrl.startsWith("/auth") ||
      req.originalUrl.startsWith("/public")
    ) {
      next();
      return;
    }

    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.json({
        status: "error",
        errorMessage: "Lütfen token belirtiniz.",
      });
      return;
    }
    const foundUserId = this.services.cache.getSync("auth_" + token);
    if (!foundUserId) {
      res.json({
        status: "error",
        errorMessage: "Token geçersiz veya hatalı.",
      });
      return;
    }

    // Burada user id datasını request'e ekliyoruz (inject ediyoruz).
    req.authUserId = foundUserId;

    next();
  }

  async configureHttpServer() {
    const controllerFiles = findAllControllerFiles();
    //console.log(">> Controllers", controllerFiles);

    for (let i = 0; i < controllerFiles.length; i++) {
      const controllerFile = controllerFiles[i];

      const controllerClass = await import(controllerFile);

      // Gelen datanın mutlaka class olduğunu varsayıyoruz.
      const obj = new controllerClass.default(this.services);
      await obj.registerHttpRoutes(this.httpServer);
      try {
      } catch (e) {
        console.error(">> 🚀 e:", e);
        //console.log("This file excluding: ", controllerFile);
      }
    }
  }

  async start() {
    console.log("Http server starting.");

    await this.configureHttpServer();

    this.httpServer.listen(
      parseInt(process.env.HTTP_SERVER_PORT),
      process.env.HTTP_SERVER_HOST,
      () => {
        console.log(
          `HTTP Server started at http://${process.env.HTTP_SERVER_HOST}:${process.env.HTTP_SERVER_PORT}`
        );
      }
    );
  }
}
