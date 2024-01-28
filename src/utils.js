import fs from "fs";

/* Bütün uygulamanın ihtiyaç duyduğu ortak fonksiyonlaru buraya yazıp export ediyoruz. */

export const bufferToString = (buffer, encoding = "utf-8") => {
  return Buffer.from(buffer).toString(encoding);
};

export const findAllControllerFiles = () => {
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

        if (
          currentFile.name.endsWith("spec.js") ||
          currentFile.name.endsWith("test.js")
        ) {
          return;
        }

        controllerFiles.push(currentDirectory + "/" + currentFile.name);
      }
    );
  }
  findControllerFiles(controllerFolder);

  return controllerFiles;
};

export const ROOM_PREFIXES = {
  room_id: "room_id_",
};

export const FRONTEND_WS_COMMANDS = {
  incoming_message: "incoming_message",
  peer_subscribed: "peer_subscribed",
  peer_unsubscribed: "peer_unsubscribed",
};

export const sleep = async (ms) => {
  return new Promise((r) => setTimeout(r, ms));
};
