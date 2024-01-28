/* Bir websocket connection objesi üzerinde işlem yapmaya çalıştığımızda
(send, getRemoteAddress, ping vs) eğer bağlantı kopmuşsa exception throw eder.
Bu exception'ı handle edebilmek için mecburen try-catch bloğu kurmamız gerekiyor.
Fakat her zaman bunu yapmak kolay olmaz çünkü tek satırlık bir işlem için
3-4 satırlık try-catch bloğu kurmak işimizi zorlaştırır.

Bunun yerine `ws` objesini kapsayan ve `ws` ile aynı fonksiyonlara sahip
olan bir class tanımlarız. Bütün try-catch bloklarını bu class
içerisinde yaparız. `ws` objesini kullandığımız heryerde aslında bu kapsayıcı
class'ı kullanacağımız için try-catch bloğu kurmamıza gerek kalmaz. Çünkü
zaten bu blok bu class içerisinde mevcut.

*/

export default class WsConnectionHandler {
  // UWS kütüphanesinden gelen websocket connection objesi.
  ws;

  constructor(ws) {
    this.ws = ws;
  }

  getUserData() {
    try {
      return this.ws.getUserData();
    } catch (e) {}
  }

  send(data) {
    try {
      return this.ws.send(data);
    } catch (e) {}
  }

  publish(roomId, data) {
    try {
      return this.ws.publish(roomId, data);
    } catch (e) {}
  }

  unsubscribe(roomId) {
    try {
      return this.ws.unsubscribe(roomId);
    } catch (e) {}
  }

  isSubscribed(roomId) {
    try {
      return this.ws.isSubscribed(roomId);
    } catch (e) {}

    return false;
  }

  subscribe(roomId) {
    try {
      return this.ws.subscribe(roomId);
    } catch (e) {}
  }

  close() {
    try {
      return this.ws.close();
    } catch (e) {}
  }

  getRemoteAddressAsText() {
    try {
      return this.ws.getRemoteAddressAsText();
    } catch (e) {}
  }
}
