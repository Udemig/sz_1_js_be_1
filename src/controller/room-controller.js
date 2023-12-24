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
    if (!this.checkAuth(req, res)) return;

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
    if (!this.checkAuth(req, res)) return;

    // TODO Handle here.
    console.log(">> RoomController::createRoom() function invoked.");
    res.json({
      status: "success",
    });
  }

  join(req, res) {
    if (!this.checkAuth(req, res)) return;

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
    if (!this.checkAuth(req, res)) return;

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
