import { Message } from "../models/message.js";
import { Room } from "../models/room.js";
import { User } from "../models/user.js";
import createRoomValidator from "../request-validators/room/create-room-validator.js";
import { FRONTEND_WS_COMMANDS, ROOM_PREFIXES, sleep } from "../utils.js";
import BaseController from "./base-controller.js";

export default class RoomController extends BaseController {
  /* TODO bind() fonksiyonunun ne işe yaradığını açıkla. */
  httpRoutes = {
    "/room/create": this.createRoom.bind(this),

    /* Aşağıdaki route dinamik olduğundan dolayı eğer şu adrese `/room/getMessages`
    istek atarsak beklenilen fonksiyona değil getRoom fonksiyonuna istek gitmiş olur.
    Bu istenmeyen bir durumdur ve route'ların doğru çalışmadığı izlenimini verebilir.
    Bu problemi çözmenin iki yolu var. Birincisi bu route'ı en alt sıraya almak.
    İkincisi de bu route'ın adresini değiştirmek. */
    //"/room/:id": this.getRoom.bind(this), // Bu tanımlama mantıksal hataya sebep oluyor.
    "/room/getById/:id": this.getRoom.bind(this), // Hatayı bu şekilde çözdük.

    "/room/sendMessage": this.sendMessage.bind(this),
    "/room/getMessages": this.getMessages.bind(this),

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
    // Bu ws connection'a ait userId bilgisi görünmeli. Eğer bu bilgi yokken
    // bir room'a subscribe olmaya çalışılıyorsa buna müsade etmemeliyiz.
    const userId = ws.getUserData().userId;
    if (!userId) {
      // Eğer bir websocket bağlantısı önceden auth olmamışsa hiçbir room'a da abone olamaz.
      ws.send(this.getErrorJson("Odaya katılabilmek için önce login olunuz."));
      return;
    }

    // Bu client'ı ilgili room'a abone yap.
    ws.subscribe(ROOM_PREFIXES.room_id + incomingData.id);

    // Abone olduğunu client'ın kendisine bildirelim.
    ws.send(
      JSON.stringify(
        this.getSuccessJson({
          roomId: incomingData.id,
        })
      )
    );

    // Odaya yeni birisinin katıldığını bütün abonelere bildirelim.
    setTimeout(() => {
      ws.publish(
        ROOM_PREFIXES.room_id + incomingData.id,
        JSON.stringify({
          command: FRONTEND_WS_COMMANDS.peer_subscribed,
          data: {
            userId,
            roomId: incomingData.id,
          },
        })
      );
    }, 100);
  }

  async wsRoomExitHandler(ws, incomingData, wsServer) {
    const userId = ws.getUserData().userId;
    if (!userId) {
      ws.send(this.getErrorJson("Lütfen önce giriş yapınız."));
      return;
    }

    ws.unsubscribe(ROOM_PREFIXES.room_id + incomingData.id);

    // Odaya yeni birisinin katıldığını bütün abonelere bildirelim.
    setTimeout(() => {
      ws.publish(
        ROOM_PREFIXES.room_id + incomingData.id,
        JSON.stringify({
          command: FRONTEND_WS_COMMANDS.peer_unsubscribed,
          data: {
            userId,
            roomId: incomingData.id,
          },
        })
      );
    }, 100);
  }

  async delete(req, res) {
    // TODO Don't delete rooms, hide them only.

    console.log(">> RoomController::delete() function invoked.");
    res.json({
      status: "success",
    });
  }

  normalizeListInput(req) {
    const ascDesc = ["asc", "desc"];

    const roomName = req.body.room_name;

    const createDateOrder = ascDesc.includes(req.body.create_date_order)
      ? req.body.create_date_order
      : null;

    const nameOrder = ascDesc.includes(req.body.name_order)
      ? req.body.name_order
      : null;

    let pageNo = parseInt(req.body.page_no);
    pageNo = pageNo < 1 ? 1 : pageNo;

    return {
      roomName,
      createDateOrder,
      nameOrder,
      pageNo,
    };
  }

  async list(req, res) {
    /* Nasıl bir filtreleme yapacağız? Sadece room isimlerini filtreleyeceğiz.
    Sıralama işlemi için de oluşturulma tarihine göre, aktif kullanıcı sayısına göre
    olabilir. Ama aktif kullanıcı sayısına göre sıralama yaparken mongoose
    kullanamayacağımızdan dolayı bunu iptal edelim. Oluşturma tarihine göre ve
    isme göre sıralayalım.  */

    const input = this.normalizeListInput(req);

    const filter = {
      visibility: "public",
    };

    if (input.roomName) {
      filter.name = { $regex: input.roomName, $options: "i" };
    }

    const sortData = {};
    if (input.nameOrder) {
      sortData.name = input.nameOrder === "desc" ? -1 : 1;
    }
    if (input.createDateOrder) {
      sortData.createdAt = input.createDateOrder === "desc" ? -1 : 1;
    }

    /* Sıralama işlemleri ascending ve descending olarak isimlendirilir. Bu yüzden
    bunların kısaltmalarını frontendden bekleyebiliriz (asc, desc).
    
    Backend'den sayfa bilgileri de gelmeli. Toplamda kaç sayfa var, şuanki sayfa no
    ve şuanki sayfadaki itemler. */

    const pagination = {
      recordsTotal: await Room.find(filter).countDocuments().exec(),
      recordsPerPage: 3,
      currentPage: 1,
    };

    /* Sayfa sayısını hesaplamak için recordsTotal'i rpp'ye bölüp yukarı yuvarlayacağız.
    ÖRneğin 95 adet kayıt var, rpp değeri 10 ise Math.ceil(95/10) = 10
    ÖRneğin 91 adet kayıt var, rpp değeri 10 ise Math.ceil(91/10) = 10
    
    */

    // TODO Sayfalama yap
    const items = await Room.find(filter)
      .sort(sortData)
      .skip((input.pageNo - 1) * pagination.recordsPerPage)
      .limit(pagination.recordsPerPage)
      .exec();

    await sleep(777);

    return this.showSuccess(res, { items, pagination });
  }

  async getRoom(req, res) {
    let room = await Room.findById(req.params.id);
    room = room.toJSON();

    /* Öncelikle bu room'a abone olmuş olan aktif websocket client'larını
    websocket servisten alıyoruz. Buradan bize user_id dizisi dönecek.
    Sonra bu user id'leri mongodb'den sorgulayıp bütün userların isimlerine
    ulaşacağız. Sonra yine bunları dizi olarak `room.peers` değişkenine
    aktaracağız. Böylece user listesini room detay sayfasına gösterebileceğiz. */

    const onlineUserIds =
      await this.services.websocketService.getRoomOnlinePeers(req.params.id);

    const promises = onlineUserIds.map((userId) =>
      User.findById(userId).select("_id, username")
    );
    const peers = await Promise.all(promises);

    this.showSuccess(res, {
      room,
      peers,
    });
  }

  async createRoom(req, res) {
    const validResult = createRoomValidator.validate(req.body);
    if (validResult.error) {
      this.showError(res, validResult.error.message);
      return;
    }

    const room = await Room.create({
      ...validResult.value,
      userId: req.authUserId,
    });
    this.showSuccess(res, { room });
  }

  /* Burada dikkat etmemiz gereken durum şu: mesajların id'ye göre tersten sıralı
  gelmesini istiyoruz. Ayrıca eğer mesajın başlangıç id'si gönderilmemişse o zaman
  son mesajdan itibaren seçeceğiz, başlangıç id'si gönderilmişse o zaman o id'den küçük
  olan mesajları seçeceğiz. */
  async getMessages(req, res) {
    const roomRow = await Room.findById(req.query.room_id);
    if (!roomRow) {
      return this.showError(res, "Oda bulunamadı.");
    }

    let messages = await Message.find({
      roomId: roomRow._id,
    })
      //.populate("userId")
      //      .populate({
      //        path: "userId",
      //        select: "username -_id",
      //      })
      .sort({ _id: -1 })
      .limit(10)
      .exec();

    // TODO Bu satırı iyice revize et.
    messages = JSON.parse(JSON.stringify(messages));
    messages.reverse();

    // TODO Aşağıdaki döngüyü de revize etmenin bir yolunu bul.
    const users = [];
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const user = await User.findById(message.userId);
      users.push({
        username: user.username,
      });
    }

    this.showSuccess(
      res,
      messages.map((message, index) => {
        return {
          message,
          sender: users[index],
        };
      })
    );
  }

  async sendMessage(req, res) {
    const roomRow = await Room.findById(req.body.room_id);

    if (roomRow) {
      const message = await Message.create({
        userId: req.authUserId,
        roomId: req.body.room_id,
        text: req.body.message,
        type: "text",
      });
      console.log(">> 🚀 message:", message);

      const user = await User.findById(req.authUserId);

      // TODO Gelen mesaj bilgisini db'ye kaydet ve sonra websocketten room'daki diğer client'lara gönder.
      this.services.websocketService.sendData(
        ROOM_PREFIXES.room_id + req.body.room_id,
        {
          command: FRONTEND_WS_COMMANDS.incoming_message,
          data: {
            message,
            sender: {
              username: user.username,
              firstname: user.firstname,
              lastname: user.lastname,
            },
          },
        }
      );

      res.json({
        status: "success",
        datetime: Date.now(),
      });
    } else {
      return this.showError(res, "Bu oda sistemde mevcut değil.");
    }
  }

  async lastRooms(req, res) {
    const rooms = await Room.find().sort({ _id: -1 }).limit(6).exec();

    this.showSuccess(res, {
      rooms,
    });
  }
}
