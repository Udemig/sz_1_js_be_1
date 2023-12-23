import uWS from "uWebSockets.js";
import { bufferToString } from "../utils.js";

export default class WebsocketServer {
  services = null;
  server = null;

  constructor(services) {
    this.services = services;
    console.log("Websocket server instance created.");
  }

  /* Belirtilen topic'e mesaj gönder. `sendData()` methodu diğer servislerden
  erişilebilir. Bu sayede örneğin http sunucusundan websocket sunucusuna mesaj
  iletmek mümkün olur. */
  async sendData(topic, message) {
    if (this.server === null) {
      return false;
    }
    message = typeof message === "string" ? message : JSON.stringify(message);

    this.server.publish(topic, message, false, false);

    return true;
  }

  async start() {
    console.log("Websocket server starting.");

    this.server = uWS.App();

    this.server
      .ws("/*", {
        /* Options */
        compression: uWS.SHARED_COMPRESSOR,
        maxPayloadLength: 16 * 1024 * 1024,
        idleTimeout: 10,
        /* Handlers */

        /* Herhangi bir websocket client'ı yeni bağlantı oluşturduğunda bu fonksiyon çalışır. */
        open: (ws) => {
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
        },
        /* Herhangi bir websocket client'ından sunucuya mesaj geldiğinde bu fonksiyon çalışır. */
        message: (ws, message, isBinary) => {
          console.log(
            "WS message received from IP: " +
              bufferToString(ws.getRemoteAddressAsText()),
            bufferToString(message, "utf-8")
          );

          if (message.command === "create_new_room") {
          } else if (message.command === "join_room") {
          } else if (message.command === "join_room") {
          } else if (message.command === "join_room") {
          } else if (message.command === "join_room") {
          } else if (message.command === "join_room") {
          } else if (message.command === "join_room") {
          } else if (message.command === "join_room") {
          }

          /* Ok is false if backpressure was built up, wait for drain */
          let ok = ws.send(
            JSON.stringify({
              status: "success",
              data: "This data sent from server.",
            }),
            false
          );
        },
        /* Bu fonksiyona ihtiyacımız yok. */
        drain: (ws) => {
          console.log(
            "WebSocket backpressure: " +
              bufferToString(ws.getRemoteAddressAsText())
          );
        },
        /* Herhangi bir websocket client'ı bağlantısını kapattığında bu fonksiyon çalışır. */
        close: (ws, code, message) => {
          console.log("Websocket connection closed");
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
