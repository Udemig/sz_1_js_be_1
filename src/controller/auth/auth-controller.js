import bcrypt from "bcrypt";
import { User } from "../../models/user.js";
import loginRequestValidator from "../../request-validators/auth/login-request-validator.js";
import { AuthenticationService } from "../../services/authentication/authentication-service.js";
import BaseController from "../base-controller.js";

/* MVC: Model-View-Controller anlamına gelir. Controller'ların asıl görevi client'tan gelen
datayı validate etmek ve valid datayı ilgili servise göndermek. Sonra bu servisten dönen
datayı da client'a göndermek. Yani controllerlarda business logic olmamalı, bütün business
logicleri servis class'larında yazmamız gerekiyor ve bu servisler bağımsız olmalı.

Authentication: doğrulama
Authorization: yetkilendirme
*/

export default class AuthController extends BaseController {
  httpRoutes = {
    "/auth/login": this.login.bind(this),
    "/auth/register": this.register.bind(this),
  };

  websocketRoutes = {
    "auth/login": this.wsLoginHandler.bind(this),
  };

  async wsLoginHandler(ws, incomingData, wsServer) {
    // token bilgisini kontrol et, geçerliyse "success" mesajı gönder,
    // geçersiz token girilmişse o zaman hata mesajı gönder.
    const foundUserId = this.services.cache.getSync(
      "auth_" + incomingData.token
    );

    /* Token mevcutsa userId bilgisi gelir. Eğer userId varsa client'a success
    mesajı gönder, eğer yoksa error message gönder ve bir süre sonra connection'ı
    kapat. Çünkü auth olmayan kullanıcıların websocketten data transferi yapmayacakları
    için bu connection servera yük olmasın. */
    if (foundUserId) {
      ws.getUserData().userId = foundUserId;

      ws.send(
        JSON.stringify({
          status: "success",
          data: "Başarıyla login oldunuz.",
        })
      );
    } else {
      ws.send(
        JSON.stringify({
          status: "error",
          data: "Hatalı token girildi, bağlantı sonlandırılıyor.",
        })
      );

      setTimeout(() => {
        ws.close();
      }, 2_000);
    }
  }

  async login(req, res) {
    /* Gelen inputları validate et. Tabiki validation için daha iyi yöntemler mevcut ama
    şimdilik olayın mantığını kavrayalım sonra daha ileri seviye yöntemlere geçeriz. 
    if (!req.body.username || req.body.username.length < 3) {
      return this.showError(res, "Lütfen kullanıcı adınızı kontrol ediniz.");
    }
    console.log(">> typeof pw", req.body.password, !req.body.password);
    if (!req.body.password || req.body.password.length < 6) {
      return this.showError(res, "Şifreniz en az 6 karakter olmalı.");
    }
    */

    /* Yukarıdaki yöntem dataların her zaman string geleceğini farzederek yapılmış. Fakat
    datalardan biri number olarak gelirse o zaman bu iflerin hiçbirisi çalışmıyor. Dolayısıyla
    biz datayı validate etmemiş oluyoruz. Valid olmayan datanın servislere gönderilmesi
    beklenmeyen problemlere sebep olabilir. Bu problemleri çözmek için daha kapsamlı
    validasyon yöntemleri kullanmalıyız.
    
    Normalde daha büyük frameworklerde controllerların validasyon işlemleri için daha kolay
    ve efektif yöntemler mevcut (örneğin nestjs, nextjs). Fakat biz express kütüphanesini
    kullanıyoruz ve bunda herhangi bir validasyon özelliği yok. Bundan dolayı validasyon
    işlemleri için third party library'ler kullanmalıyız. En sık kullanılan library'ler
    joi, zod, class-validator library'leridir.
    */

    try {
      const validInput = await loginRequestValidator.validateAsync(req.body);
      console.log(">> 🚀 validInput:", validInput);

      const authService = new AuthenticationService(this.services);
      const result = await authService.login(
        validInput.username,
        validInput.password
      );
      console.log(">> 🚀 result:", result);

      return this.showSuccess(res, result);
    } catch (e) {
      return this.showError(res, e.message);
    }
  }

  register(req, res) {
    if (!req.body.username || req.body.username.length < 3) {
      return this.showError(res, "Lütfen kullanıcı adınızı kontrol ediniz.");
    }
    if (!req.body.password || req.body.password.length < 6) {
      return this.showError(res, "Şifreniz en az 6 karakter olmalı.");
    }
    if (!req.body.email || req.body.email.length < 6) {
      return this.showError(res, "Lütfen e-posta adresinizi giriniz.");
    }

    (async () => {
      try {
        const hashedPassword = await bcrypt.hash(
          req.body.password + process.env.APP_KEY,
          12
        );

        const newUser = await User.create({
          ...req.body,
          password: hashedPassword,
        });

        console.log("New user: ", newUser);

        return this.showSuccess(res, {
          username: newUser.username,
        });
      } catch (e) {
        /*
        "E11000 duplicate key error collection: chat_backend.users 
        index: username_1 dup key: { username: \"test3\" }"
        */
        return this.showError(
          res,
          "Lütfen formu kontrol ediniz. Username veya email daha önceden kullanılmış olabilir."
        );
      }
    })();
  }
}
