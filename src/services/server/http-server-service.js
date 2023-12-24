import cors from "cors";
import express from "express";

// fs: File System, dosya ve dizinlerle çalışmayı sağlar, nodejs'e gömülü gelir bu yüzden
// npm install yapmaya gerek yoktur.
import fs from "fs";

export default class HttpServer {
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
      cors({ origin: "http://localhost:5173", credentials: true })
    );
  }

  findAllControllerFiles() {
    const controllerFiles = [];

    const controllerFolder = process.cwd() + "/src/controller";

    function findControllerFiles(currentDirectory) {
      fs.readdirSync(currentDirectory, { withFileTypes: true }).forEach(
        (currentFile) => {
          //console.log("Controller file: ", currentFile);

          if (currentFile.isDirectory()) {
            findControllerFiles(currentDirectory + "/" + currentFile.name);
            return;
          }

          controllerFiles.push(currentDirectory + "/" + currentFile.name);
        }
      );
    }
    findControllerFiles(controllerFolder);

    return controllerFiles;
  }

  async configureHttpServer() {
    const controllerFiles = this.findAllControllerFiles();
    //console.log(">> Controllers", controllerFiles);

    for (let i = 0; i < controllerFiles.length; i++) {
      const controllerFile = controllerFiles[i];

      const controllerClass = await import(controllerFile);
      //console.log("----------------------");
      //console.log(">> Ctrl: ", controllerFile);
      //console.log(">> Val :", controllerClass.default);
      //console.log("----------------------");

      try {
        // Gelen datanın mutlaka class olduğunu varsayıyoruz.
        const obj = new controllerClass.default(this.services);
        await obj.registerRoutes(this.httpServer);
      } catch (e) {
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