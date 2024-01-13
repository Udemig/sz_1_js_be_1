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

        controllerFiles.push(currentDirectory + "/" + currentFile.name);
      }
    );
  }
  findControllerFiles(controllerFolder);

  return controllerFiles;
};
