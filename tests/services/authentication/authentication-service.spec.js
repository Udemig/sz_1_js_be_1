import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { Cache } from "file-system-cache";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { User } from "../../../src/models/user.js";
import AuthenticationService from "../../../src/services/authentication/authentication-service.js";

// Basit testler için bu sintaksı kullanabiliriz. Örneğin iki sayıyı toplayan fonksiyonun
// testi, stringler üzerinde işlem yapan fonksiyonların testi gibi.
test("authentication-service login success", async () => {
  // ön hazırlık sürecini burada yaparız.

  //const service = new AuthenticationService();
  //const result = await service.login("foo", "bar");
  //console.log(">> 🚀 result:", result);
  expect(true).toBe(true);
});

/* Bağımlılıkları olan methodların testlerini yazmak bir ön hazırlık ve kapanış süreçleri
gerektirir. Örneğin veritabanına bağlantı açmak ve test bittikten sonra bağlantıyı kapatmak
gibi. Bu tarz işlemleri yapmak için `describe` yöntemini kullanmalıyız. */
describe("authentication-service login operations", () => {
  let mongod; // mongo daemon'ın kısaltılmışı
  let mongoConnection;

  let services = {
    cache: new Cache({
      basePath: "./.cache/.test", // (optional) Path where cache files are stored (default).
      ns: "app", // (optional) A grouping namespace for items.
      hash: "sha1", // (optional) A hashing algorithm used within the cache key.
      ttl: 60, // (optional) A time-to-live (in secs) on how long an item remains cached.
    }),
  };

  beforeAll(async () => {
    dotenv.config({ path: process.cwd() + "/.env" });

    // Mongo sunucusu
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    // Mongoose clientı
    mongoConnection = await mongoose.connect(uri, {
      dbName: process.env.DB_NAME,
      autoCreate: true,
      socketTimeoutMS: 5_000,
    });
    console.log("Mongodb connected.");
  });

  afterAll(async () => {
    // Sadece serverı kapatsak yeterli, cliewnt kendiliğinden kapanıyor.
    await mongod.stop();
  });

  it("should login success", async () => {
    // Önce örnek bir kullanıcı ekleyelim. Sonra bu kullanıcı için login olmaya çalışalım.
    const testEmail = "test1@test.com";
    const testUser = "test_user";
    const testPass = "test_password";

    const hashedPassword = await bcrypt.hash(
      testPass + process.env.APP_KEY,
      12
    );

    const newUser = await User.create({
      username: testUser,
      email: testEmail,
      firstname: "test1",
      lastname: "test",
      password: hashedPassword,
    });

    console.log("New user: ", newUser);

    const service = new AuthenticationService(services);
    const result = await service.login(testUser, testPass);
    console.log(">> 🚀 result:", result);

    expect(typeof result.token).toBe("string");
    expect(typeof result.user).toBe("object");
    expect(result.user.username).toBe(testUser);
    expect(result.user.email).toBe(testEmail);
  });

  it("should throw wrong password error", async () => {
    // TODO Handle here.
    expect(true).toEqual(true);
  });

  it("should throw user not found error", async () => {
    // TODO Handle here.
    expect(true).toEqual(true);
  });
});
