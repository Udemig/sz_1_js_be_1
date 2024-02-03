import { Cache } from "file-system-cache";
import HttpServerService from "../../../src/services/server/http-server-service.js";

function createEmptyHttpServerService() {
  return new HttpServerService({});
}

test("Http Server Servis checkAuth fonksiyonu doğru çalışıyor mu?", () => {
  /* Amacımız HttpServer class'ı içerisindeki checkAuth() fonksiyonunun
  beklenildiği gibi çalışmasını sağlamak. Bundan dolayı öncelikle bizim
  HttpServer instance'ına ihtiyacımız var. Bu yüzden bir adet instance
  oluşturuyoruz. */

  const httpServer = createEmptyHttpServerService();

  let result = false;

  const dummyReq = {
    originalUrl: "/auth",
  };
  const dummyRes = {};
  const dummyNext = () => {
    console.log("dummyNext invoked.");
    result = true;
  };

  httpServer.checkAuth(dummyReq, dummyRes, dummyNext);

  expect(result).toBe(true);
});

test("her zaman başarılı login olma denemesi", async () => {
  const services = {
    cache: new Cache({
      basePath: "./.cache", // (optional) Path where cache files are stored (default).
      ns: "app", // (optional) A grouping namespace for items.
      hash: "sha1", // (optional) A hashing algorithm used within the cache key.
      ttl: 60, // (optional) A time-to-live (in secs) on how long an item remains cached.
    }),
  };
  const httpServer = new HttpServerService(services);

  let result = false;

  const dangerouslyHeaders = [
    "",
    "*",
    "' OR 1 = 1 -- ", // örnek bir sql injection saldırısı
    "../*",
    "../../../../../../../../tmp/*",
  ];

  dangerouslyHeaders.forEach((dangerouslyHeader) => {
    console.log(">> 🚀 dangerouslyHeader:", dangerouslyHeader);

    const dummyReq = {
      originalUrl: "/user/me",
      headers: {
        authorization: dangerouslyHeader,
      },
    };
    const dummyRes = {
      json: function (data) {
        console.log(data);
      },
    };
    const dummyNext = () => {
      console.log("dummyNext invoked.");
      result = true;
    };

    httpServer.checkAuth(dummyReq, dummyRes, dummyNext);

    expect(result).toBe(false);
    expect(dummyReq.authUserId).toBe(undefined);
  });
});
