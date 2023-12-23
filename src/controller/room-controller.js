import BaseController from "./base-controller.js";

export default class RoomController extends BaseController {
  routes = {
    "/room/join": this.join.bind(this),
    "/room/create": this.createRoom.bind(this),
    "/room/sendMessage": this.sendMessage.bind(this),
  };

  createRoom(req, res) {
    // TODO Handle here.
    console.log(">> RoomController::createRoom() function invoked.");
    res.json({
      status: "success",
    });
  }

  join(req, res) {
    console.log(">> RoomController::join() function invoked.");

    // TODO Websocketteki diğer kullanıcılara bilgi gönder.

    console.log(">> this.services", this.services.websocketService);

    this.services.websocketService.sendData("default", {
      message: "Yeni bir kullanıcı odaya girdi.",
    });

    res.json({
      status: "success",
      datetime: Date.now(),
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
