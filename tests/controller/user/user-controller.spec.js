import dotenv from "dotenv";
import AuthController from "../../../src/controller/auth/auth-controller.js";
import UserController from "../../../src/controller/user/user-controller.js";
import { User } from "../../../src/models/user.js";
import {
  mongoMocker,
  reqMocker,
  resMocker,
  servicesMocker,
} from "../../utils/mocker.js";

describe("user controller", () => {
  let mockService;
  let mongoServer;
  let mongoClient;

  beforeAll(async () => {
    dotenv.config({ path: process.cwd() + "/.env" });

    [mongoServer, mongoClient] = await mongoMocker();

    mockService = servicesMocker();
  });

  afterAll(async () => {
    await mongoServer.stop();
  });

  it("should logout auth header throw error", async () => {
    const dangerouslyData = [
      { authorization: "" },
      { authorization: "!'*-" },
      { authorization: "       " },
      {},
      { authorization: "Bearer falanfilan" },
      { authorization: "Token falanfilan" },
    ];

    let result = null;
    const mockRes = resMocker((data) => (result = data));
    const controller = new UserController(mockService);

    for (let i = 0; i < dangerouslyData.length; i++) {
      const mockReq = reqMocker(null, null, dangerouslyData[i]);

      await controller.logout(mockReq, mockRes);
      expect(result.status).toBe("error");
    }
  });

  it("should logout success", async () => {
    const authController = new AuthController(mockService);
    const userController = new UserController(mockService);

    const username = "testuser";
    const password = "testpass";
    const email = "test@test.com";

    let result = null;
    const mockRes = resMocker((data) => (result = data));

    const mockRegisterReq = reqMocker({ username, password, email });
    await authController.register(mockRegisterReq, mockRes);
    expect(result.status).toBe("success");

    const user = await User.findOne({ username });
    console.log(">> 🚀 user:", user);
    expect(user.username).toBe(username);

    const mockLoginReq = reqMocker({ username, password });
    await authController.login(mockLoginReq, mockRes);
    expect(result.status).toBe("success");
    console.log(">> 🚀 result:", result);

    const token = result.data.token;
    const mockLogoutReq = reqMocker(null, null, {
      authorization: "Token " + token,
    });
    await userController.logout(mockLogoutReq, mockRes);
    expect(result.status).toBe("success");

    await userController.logout(mockLogoutReq, mockRes);
    expect(result.status).toBe("error");

    expect(true).toBe(true);
  });
});
