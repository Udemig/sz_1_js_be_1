import createRoomValidator from "../request-validators/room/create-room-validator.js";
import BaseController from "./base-controller.js";

export default class RoomController extends BaseController {
  routes = {
    "/room/join": this.join.bind(this),
    "/room/create": this.createRoom.bind(this),
    "/room/sendMessage": this.sendMessage.bind(this),
    "/room/delete": this.delete.bind(this),
    "/room/list": this.list.bind(this),
  };

  delete(req, res) {
    // TODO Handle here.
    console.log(">> RoomController::delete() function invoked.");
    res.json({
      status: "success",
    });
  }

  list(req, res) {
    // TODO Handle here.
    console.log(">> RoomController::list() function invoked.");
    res.json({
      status: "success",
    });
  }

  createRoom(req, res) {
    console.log(">> Raw input: ", req.body);

    const validResult = createRoomValidator.validate(req.body);
    if (validResult.error) {
      this.showError(validResult.error);
      return;
    }

    console.log(">> valid input: ", validResult);

    // TODO Insert object to db.
    validResult.value;

    console.log(">> RoomController::createRoom() function invoked.");
    // TODO Find a way for validating inputs.

    this.showSuccess(res, {
      // TODO Fill this prop.
      roomInfo: validResult,
    });
  }

  join(req, res) {
    this.services.websocketService.sendData("default", {
      message: "Yeni bir kullanıcı odaya girdi.",
    });

    this.showSuccess(res, {
      // TODO Fill this prop.
      roomInfo: null,
    });
  }

  sendMessage(req, res) {
    // TODO Create authentication mechanism.

    console.log(">> RoomController::sendMessage() function invoked.");

    console.log("incoming form data:", req.body);

    // TODO Gelen mesaj bilgisini db'ye kaydet ve sonra websocketten room'daki diğer client'lara gönder.
    this.services.websocketService.sendData("default", {
      message: "Yeni bir kullanıcı odaya girdi.",
    });

    res.json({
      status: "success",
      datetime: Date.now(),
    });
  }
}
