import BaseController from "../base-controller.js";

export default class AuthController extends BaseController {
  routes = {
    "/auth/login": this.login,
    "/auth/register": this.register,
  };

  login(req, res) {
    console.log("AuthController::login() invoked.");

    res.json({
      status: "success",
      method: "login",
    });
  }

  register(req, res) {
    console.log("AuthController::register() invoked.");

    res.json({
      status: "success",
      method: "register",
    });
  }
}
