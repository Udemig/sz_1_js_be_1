import { User } from "../../models/user.js";
import BaseController from "../base-controller.js";

export default class UserController extends BaseController {
  routes = {
    "/user/me": this.me.bind(this),
    "/user/logout": this.logout.bind(this),
  };

  async me(req, res) {
    console.log("Auth userid: " + req.authUserId);

    const foundUser = await User.findOne({
      _id: req.authUserId,
    });

    return this.showSuccess(res, {
      user: {
        username: foundUser.username,
        email: foundUser.email,
        firstname: foundUser.firstname,
        lastname: foundUser.lastname,
        gender: foundUser.gender,
      },
    });
  }

  logout(req, res) {
    console.log(">> Incoming auth header:", req.headers.authorization);
    const token = req.headers.authorization.split(" ")[1];

    if (typeof token === "undefined") {
      return this.showError(res, "Lütfen token belirtiniz.");
    }
    const foundUserId = this.services.cache.get("auth_" + token);
    if (typeof foundUserId === "undefined") {
      return this.showError(res, "Token geçersiz veya hatalı.");
    }

    console.log(">>>  foundUserId:", foundUserId);

    this.services.cache.del("auth_" + token);

    return this.showSuccess(res, null);
  }
}
