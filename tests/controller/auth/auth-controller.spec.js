import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { Cache } from "file-system-cache";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import AuthController from "../../../src/controller/auth/auth-controller.js";
import { User } from "../../../src/models/user.js";
import { reqMocker, resMocker } from "../../utils/mocker.js";

describe("auth-controller login operations", () => {
  let mongod; // mongo daemon'ın kısaltılmışı
  let mongoConnection;
  let cacheFolder;
  let services;

  beforeAll(async () => {
    dotenv.config({ path: process.cwd() + "/.env" });

    cacheFolder = "./.cache/" + crypto.randomUUID();

    services = {
      cache: new Cache({
        basePath: cacheFolder, // (optional) Path where cache files are stored (default).
        ns: "app", // (optional) A grouping namespace for items.
        hash: "sha1", // (optional) A hashing algorithm used within the cache key.
        ttl: 60, // (optional) A time-to-live (in secs) on how long an item remains cached.
      }),
    };

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

    // TODO Login işleminin başarılı olması durumu için test yaz.

    let result = null;

    const mockReq = reqMocker({
      username: 1,
      password: 2,
    });

    const mockRes = resMocker((data) => (result = data));

    const controller = new AuthController(services);
    await controller.login(mockReq, mockRes);
    console.log(">> 🚀 result:", result);

    //expect(typeof result.token).toBe("string");
    //expect(typeof result.user).toBe("object");
    //expect(result.user.username).toBe(testUser);
    expect(result.status).toBe("error");
    expect(result.errorMessage).toBe('"username" must be a string');
  });

  it("should register success", async () => {
    const testUser = crypto.randomUUID().replace(/-/g, "");
    const testEmail = testUser + "@test.com";
    const testPass = "test_password";

    let result = null;
    const mockReq = reqMocker({
      username: testUser,
      password: testPass,
      email: testEmail,
    });
    const mockRes = resMocker((data) => (result = data));

    const controller = new AuthController(services);
    await controller.register(mockReq, mockRes);
    console.log(">> 🚀 register result:", result);

    expect(result.status).toBe("success");
  });

  it("should register fail", async () => {
    const dangerouslyDataSet = [
      {
        username: 1,
        password: 2,
        email: 3,
        foo: "foo",
        attac_prop: "'* -- =)(/&",
      },
      {
        username: false,
        password: {},
        email: 0,
        attac_prop: "'* -- =)(/&",
      },
      {
        username: "test",
        password: 12345,
        email: "test@",
        firstname: "",
      },
      {
        username: "test",
        password: "12345",
        email: "test@",
        firstname: "",
      },
      {
        username: "test",
        password: "123456",
        email: "test@",
        firstname: "",
      },
      {
        username: "test",
        password: "123456",
        email: "test@x",
        firstname: "",
      },
      {
        username: "test",
        password: "123456",
        email: "test@x.com",
        firstname: "",
      },
    ];

    let result = null;

    const mockRes = {
      json: function (data) {
        console.log(data);
        result = data;
      },
    };
    const controller = new AuthController(services);

    for (let i = 0; i < dangerouslyDataSet.length; i++) {
      const mockReq = {
        body: dangerouslyDataSet[i],
      };

      await controller.register(mockReq, mockRes);
      console.log(">> 🚀 register result:", result);

      expect(result.status).toBe("error");
    }
  });
});
