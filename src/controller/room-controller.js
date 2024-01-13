import { Room } from "../models/room.js";
import createRoomValidator from "../request-validators/room/create-room-validator.js";
import BaseController from "./base-controller.js";

export default class RoomController extends BaseController {
  /* TODO bind() fonksiyonunun ne işe yaradığını açıkla. */
  httpRoutes = {
    "/room/join": this.join.bind(this),
    "/room/create": this.createRoom.bind(this),
    "/room/sendMessage": this.sendMessage.bind(this),
    "/room/delete": this.delete.bind(this),
    "/room/list": this.list.bind(this),
    "/public/room/lastRooms": this.lastRooms.bind(this),
  };

  websocketRoutes = {
    "room/send": this.wsRoomSendHandler.bind(this),
    "room/join": this.wsRoomJoinHandler.bind(this),
    "room/exit": this.wsRoomExitHandler.bind(this),
  };

  async wsRoomSendHandler(ws, incomingData, wsServer) {
    // TODO Handle here.
  }

  async wsRoomJoinHandler(ws, incomingData, wsServer) {
    // TODO Handle here.
  }

  async wsRoomExitHandler(ws, incomingData, wsServer) {
    // TODO Handle here.
  }

  async delete(req, res) {
    // TODO Handle here.
    console.log(">> RoomController::delete() function invoked.");
    res.json({
      status: "success",
    });
  }

  async list(req, res) {
    // TODO Handle here.
    console.log(">> RoomController::list() function invoked.");
    res.json({
      status: "success",
    });
  }

  async createRoom(req, res) {
    console.log(">> Raw input: ", req.body);

    const validResult = createRoomValidator.validate(req.body);
    if (validResult.error) {
      this.showError(res, validResult.error.message);
      return;
    }

    console.log(">> valid input: ", validResult);

    const room = await Room.create({
      // spread operator
      ...validResult.value,
      userId: req.authUserId,
    });

    /*
{
    "status": "success",
    "data": {
        "room": {
            "userId": "65880eda3966777fdb7cbd12",
            "name": "test",
            "visibility": "public",
            "maxClient": 0,
            "peers": [],
            "_id": "65993af8e4cb60695ecc2ba0",
            "__v": 0
        }
    }
}
*/

    console.log(">> 🚀 file: room-controller.js:42 🚀 room:", room);

    this.showSuccess(res, { room });
  }

  async join(req, res) {
    this.services.websocketService.sendData("default", {
      message: "Yeni bir kullanıcı odaya girdi.",
    });

    this.showSuccess(res, {
      // TODO Fill this prop.
      roomInfo: null,
    });
  }

  async sendMessage(req, res) {
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

  async lastRooms(req, res) {
    const rooms = await Room.find().sort({ _id: -1 }).limit(6).exec();
    //console.log(">> 🚀 file: room-controller.js:102 🚀 rooms:", rooms);

    this.showSuccess(res, {
      rooms,
    });
  }
}
