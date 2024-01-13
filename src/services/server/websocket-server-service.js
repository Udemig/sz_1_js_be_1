import uWS from "uWebSockets.js";
import { bufferToString, findAllControllerFiles } from "../../utils.js";

export default class WebsocketServer {
  services = null;
  wsServer = null;

  /* Hangi ws client'ının hangi user'a ait olduğunu burada tutacağız. */
  wsClients = [];

  wsRoutes = {};

  constructor(services) {
    this.services = services;
    console.log("Websocket server instance created.");
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

    console.log("Sending HB data to these clients: " + this.wsClients.length);

    this.wsClients.forEach((ws, index) => {
      try {
        console.log("Ws client processing: ", ws.getUserData());

        console.log(
          ">> 🚀 file: websocket-server-service.js:34 🚀 ws:",
          bufferToString(ws.getRemoteAddressAsText())
        );

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

      // buraya dön
      try {
        const obj = new controllerClass.default(this.services);
        await obj.registerWebsocketRoutes(this.wsRoutes);
      } catch (e) {
        //console.log("This file excluding: ", controllerFile);
      }
    }

    console.log("All websocket routes: ", this.wsRoutes);
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
            console.log(
              "Websocket connection received, IP: " +
                bufferToString(ws.getRemoteAddressAsText())
            );

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
          console.log(
            "WS message received from IP: ",
            bufferToString(ws.getRemoteAddressAsText()),
            bufferToString(message, "utf-8")
          );
          let messageStr = bufferToString(message, "utf-8");
          let messageObj = JSON.parse(messageStr);
          console.log(">> 🚀 messageObj:", messageObj);

          /*
Client'tan sunucuya gönderilen örnek mesajlar:

>> 🚀 file: websocket-server-service.js:34 🚀 ws: 127.0.0.1
WS message received from IP: 127.0.0.1 {"token":"1335d6a4-14fa-4861-b89a-014302043bdd"}
>> 🚀 messageObj: { token: '1335d6a4-14fa-4861-b89a-014302043bdd' }
{ comand: "auth/login", token: "1335d6a4-14fa-4861-b89a-014302043bdd"}
WS message received from IP: 127.0.0.1 {"token":"1335d6a4-14fa-4861-b89a-014302043bdd"}
>> 🚀 messageObj: { token: '1335d6a4-14fa-4861-b89a-014302043bdd' }
{command: "room/send", message: "merhaba", room_id: "12"}
room/join
room/exit
*/

          /* Aşağıdaki if blokları sayesinde clienttan gelen mesajın nasıl işleneceğini
          tespit edebiliyoruz. Fakat bu yöntem en basit ve amatör yöntemdir. Mesaj türleri
          çok miktarda olduğunda daha iyi yöntemler kullanmamız gerekir. Aynı expressjs'de
          yaptığımız yönteme benzer bir yöntem geliştirebiliriz. Http controller'lar gibi
          websocket controllerlar oluşturup bunları otomatik olarak import edip
          fonksiyon ve router eşleştirmelerini yaparak gelen mesajın içerisindeki
          `command` property'si ile eşleştirerek datayı ilgili fonksiyona gönderebiliriz.
          Böylece çok miktardaki datayı farklı controllerlara bölebiliriz. */

          // buraya dön
          const routeList = Object.keys(this.wsRoutes);
          const routeMethods = Object.values(this.wsRoutes);

          // TODO Eğer bilinmeyen bir command gelmişse o zaman client'a hata mesajı gönder.

          let commandFound = false;

          routeList.forEach((item, index) => {
            if (item === messageObj.command) {
              commandFound = true;
              // Bulunan methodu invoke et.
              routeMethods[index](ws, messageObj, this.wsServer);
            }
          });

          if (!commandFound) {
            ws.send(
              JSON.stringify({
                status: "error",
                errorMessage: "Bilinmeyen bir komut gönderildi.",
              })
            );
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

        /* Bu fonksiyona ihtiyacımız yok ama yine de burada dursun. */
        drain: (ws) => {
          console.log(
            "WebSocket backpressure: " +
              bufferToString(ws.getRemoteAddressAsText())
          );
        },

        /* Herhangi bir websocket client'ı bağlantısını kapattığında bu fonksiyon çalışır. */
        close: (ws, code, message) => {
          console.log("Websocket connection closed");

          // TODO Bu `ws`  client listesinden sil.
        },
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
