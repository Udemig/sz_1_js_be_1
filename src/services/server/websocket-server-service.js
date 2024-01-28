import uWS from "uWebSockets.js";
import {
  ROOM_PREFIXES,
  bufferToString,
  findAllControllerFiles,
} from "../../utils.js";
import WsConnectionHandler from "./ws/ws-connection-handler.js";

export default class WebsocketServerService {
  services = null;
  wsServer = null;

  /* Hangi ws client'ının hangi user'a ait olduğunu burada tutacağız. */
  wsClients = [];

  // Burası şimdilik kalsın, hangi client'ın hangi room'da olduğunu tutan
  // bir yöntem geliştireceğiz.
  /* Şu şekilde bir yapı kuracağız: roomları map yapısı şeklinde tutacağız. Her odanın
  içerisinde birden fazla peer olacağından dolayı bunları da dizi olarak tutacağız. Yani
  son hali şuna benzer olacak:

  {
    "room_id_1" : [
      { ws_conn_1, user_id_1 },
      { ws_conn_2, user_id_1 },
      { ws_conn_3, user_id_6 },
      { ws_conn_4, user_id_3 },
    ],
    "room_id_2" : [
      { ws_conn_1, user_id_3 },
      { ws_conn_2, user_id_5 },
      { ws_conn_3, user_id_5 },
      { ws_conn_4, user_id_1 },
    ],
    "room_id_3" : [
    ],
    "room_id_4" : [
    ]
  }
  */

  wsRoutes = {};

  constructor(services) {
    this.services = services;
    console.log("Websocket server instance created.");
  }

  async getRoomOnlinePeers(roomId) {
    const userIds = [];

    this.wsClients.forEach((ws) => {
      try {
        console.log(
          "ws isSubscribed:",
          ws.isSubscribed(ROOM_PREFIXES.room_id + roomId)
        );
        console.log("ws userId:", ws.getUserData().userId);
        console.log("ws includes:", userIds.includes(ws.getUserData().userId));

        if (
          ws.isSubscribed(ROOM_PREFIXES.room_id + roomId) &&
          ws.getUserData().userId &&
          !userIds.includes(ws.getUserData().userId)
        ) {
          userIds.push(ws.getUserData().userId);
        }
      } catch (e) {}
    });

    console.log(">> 🚀 wsClients:", this.wsClients);
    console.log(">> 🚀 online userIds:", userIds);

    return userIds;
  }

  /* Belirtilen topic'e mesaj gönder. `sendData()` methodu diğer servislerden
  erişilebilir. Bu sayede örneğin http sunucusundan websocket sunucusuna mesaj
  iletmek mümkün olur. */
  async sendData(topic, message) {
    if (this.wsServer === null) {
      return false;
    }
    message = typeof message === "string" ? message : JSON.stringify(message);

    this.wsServer.publish(topic, message, false, false);

    return true;
  }

  async startHeartBeat() {
    this.wsClients = this.wsClients.filter((item) => item);

    this.wsClients.forEach((ws, index) => {
      try {
        //console.log("Ws client processing: ", ws.getUserData());

        if (ws.lastHbTime < Date.now() - 60) {
          delete this.wsClients[index];
        } else {
          /* Eğer data gönderilemezse şuanki bağlantı client tarafında kapatılmış ama
          bu kapanma bilgisi sunucuya gönderilmemiş. Dolayısıyla sunucu bunun hala
          açık olduğunu zannediyor. Bu durumdayken `send()` fonksiyonunu çağırırsak
          websocket server exception throw eder. Bu exception'ı aşağıdaki
          `catch (e)` bloğunda yakalarız ve şuanki client'ı delete yaparız. Böylece
          bir sonraki HB saykılında artık bu client silinmiş olur.
          */
          ws.send(JSON.stringify({ hb: Date.now() }));
        }
      } catch (e) {
        delete this.wsClients[index];
      }
    });

    setTimeout(() => this.startHeartBeat(), 5_000);
  }

  async configureWebsocketRoutes() {
    const controllerFiles = findAllControllerFiles();

    for (let i = 0; i < controllerFiles.length; i++) {
      const controllerFile = controllerFiles[i];
      const controllerClass = await import(controllerFile);

      try {
        const obj = new controllerClass.default(this.services);
        await obj.registerWebsocketRoutes(this.wsRoutes);
      } catch (e) {
        /* Aslında hiçbir catch bloğu boş bırakılmamalı. Bütün exception'lar mutlaka
        handle edilmeli. Çünkü eğer böyle yapmazsak önemsiz olduğunu sandığımız hatalar
        ileride büyük sıkıntılar çıkarabilir. */
      }
    }
  }

  async start() {
    console.log("Websocket server starting.");

    this.wsServer = uWS.App();

    await this.configureWebsocketRoutes();

    this.startHeartBeat();

    this.wsServer
      .ws("/*", {
        /* Options */
        compression: uWS.SHARED_COMPRESSOR,
        maxPayloadLength: 16 * 1024 * 1024,
        idleTimeout: 10,
        /* Handlers */

        /* Herhangi bir websocket client'ı yeni bağlantı oluşturduğunda bu fonksiyon çalışır. */
        open: (ws) => {
          try {
            /* Her yeni bağlantıyı öncelikle "default" topic'e (topic yani room yani oda) bağlayalım. */
            ws.subscribe("default");

            /* Hoşgeldin mesajını bu bağlantıya gönder. */
            ws.send(
              JSON.stringify({
                status: "success",
                data: "`default` odasına hoşgeldiniz.",
              })
            );

            this.wsClients.push(ws);
          } catch (e) {
            console.log(">> 🚀 e:", e);
          }
        },

        /* Herhangi bir websocket client'ından sunucuya mesaj geldiğinde
        bu fonksiyon çalışır. */
        message: (ws, message, isBinary) => {
          let messageStr = bufferToString(message, "utf-8");
          let messageObj = JSON.parse(messageStr);

          /* Aşağıdaki if blokları sayesinde clienttan gelen mesajın nasıl işleneceğini
          tespit edebiliyoruz. Fakat bu yöntem en basit ve amatör yöntemdir. Mesaj türleri
          çok miktarda olduğunda daha iyi yöntemler kullanmamız gerekir. Aynı expressjs'de
          yaptığımız yönteme benzer bir yöntem geliştirebiliriz. Http controller'lar gibi
          websocket controllerlar oluşturup bunları otomatik olarak import edip
          fonksiyon ve router eşleştirmelerini yaparak gelen mesajın içerisindeki
          `command` property'si ile eşleştirerek datayı ilgili fonksiyona gönderebiliriz.
          Böylece çok miktardaki datayı farklı controllerlara bölebiliriz. */

          const routeList = Object.keys(this.wsRoutes);
          const routeMethods = Object.values(this.wsRoutes);

          // TODO Eğer bilinmeyen bir command gelmişse o zaman client'a hata mesajı gönder.
          let commandFound = false;

          routeList.forEach((item, index) => {
            if (item === messageObj.command) {
              commandFound = true;
              const method = routeMethods[index];
              method(new WsConnectionHandler(ws), messageObj, this.wsServer);
            }
          });

          if (!commandFound) {
            if (typeof messageObj === "object" && messageObj.hb) {
              // TODO Handle heartbeat.
            } else {
              ws.send(
                JSON.stringify({
                  status: "error",
                  errorMessage: "Bilinmeyen bir komut gönderildi.",
                })
              );
            }
          }

          /* Ok is false if backpressure was built up, wait for drain */
          //let ok = ws.send(
          //  JSON.stringify({
          //    status: "success",
          //    data: "This data sent from server.",
          //  }),
          //  false
          //);
        },

        /* Bu fonksiyona ihtiyacımız yok ama yine de burada dursun. Aslında bu event'ın
        amacı beklemede duran çok fazla mesaj biriktiğinde çalışır. Dolayısıyla kuyruğun
        dolduğunu bu event vasıtasıyla anlayabiliriz ve ona göre aksiyon alabiliriz. */
        drain: (ws) => {
          console.log(
            "WebSocket backpressure: " +
              bufferToString(ws.getRemoteAddressAsText())
          );
        },

        /* Herhangi bir websocket client'ı bağlantısını kapattığında bu fonksiyon çalışır. */
        close: (ws, code, message) => {},
      })
      .any("/*", (res, req) => {
        res.end("HTTP Server response");
      })
      .listen(
        process.env.WEBSOCKET_SERVER_HOST,
        parseInt(process.env.WEBSOCKET_SERVER_PORT),
        (token) => {
          if (token) {
            console.log(
              `Websocket Server started at ws://${process.env.WEBSOCKET_SERVER_HOST}:${process.env.WEBSOCKET_SERVER_PORT}`
            );
          } else {
            console.log(
              `Failed to listen websocket server at ws://${process.env.WEBSOCKET_SERVER_HOST}:${process.env.WEBSOCKET_SERVER_PORT}`
            );
          }
        }
      );
  }
}
