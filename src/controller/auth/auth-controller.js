import bcrypt from "bcrypt";
import { User } from "../../models/user.js";
import BaseController from "../base-controller.js";

/* MVC: Model-View-Controller anlamına gelir. Controller'ların asıl görevi client'tan gelen
datayı validate etmek ve valid datayı ilgili servise göndermek. Sonra bu servisten dönen
datayı da client'a göndermek. Yani controllerlarda business logic olmamalı, bütün business
logicleri servis class'larında yazmamız gerekiyor ve bu servisler bağımsız olmalı.

Authentication: doğrulama
Authorization: yetkilendirme
*/

export default class AuthController extends BaseController {
  routes = {
    "/auth/login": this.login.bind(this),
    "/auth/register": this.register.bind(this),
  };

  async login(req, res) {
    /* Gelen inputları validate et. Tabiki validation için daha iyi yöntemler mevcut ama
    şimdilik olayın mantığını kavrayalım sonra daha ileri seviye yöntemlere geçeriz. */
    if (!req.body.username || req.body.username.length < 3) {
      return this.showError(res, "Lütfen kullanıcı adınızı kontrol ediniz.");
    }
    if (!req.body.password || req.body.password.length < 6) {
      return this.showError(res, "Şifreniz en az 6 karakter olmalı.");
    }

    /* Raw passwordü (ham şifreyi) doğrudan hashlersek bu bir tık güvenlik zaafiyeti
    oluşturabilir. Çünkü kullanıcılar tembeldir ve karmaşık şifreler kullanmazlar.
    Çoğunlukla validasyonu geçecek ama aslında hala basit olan ve tahmin edilebilir
    olan şifreler kullanırlar. Eğer bu şekilde gelen şifreyi hashlersek o zaman saldırganlar
    hala kullanıcıların hesaplarını ele geçirebilir. Bu problemden kurtulmak için
    şifreleri tuzlayarak (salt) hashlememiz gerekiyor. Bunu nasıl yapacağız? Private
    bir key'i şifrelerin sonuna ekleyip o şekilde hashleyeceğiz. O zaman saldırganlar
    veritabanını ele geçirse bile bizim kendi gizli key'imizi bilmedikleri için kimsenin
    şifresine ulaşamazlar. */
    const foundUser = await User.findOne({
      username: req.body.username,
    });

    if (
      !foundUser ||
      !bcrypt.compareSync(
        req.body.password + process.env.APP_KEY,
        foundUser.password
      )
    ) {
      return this.showError(
        res,
        "Kullanıcı bulunamadı, lütfen şifrenizi kontrol ediniz."
      );
    }

    // JWT bilgisini oluştur ve client'a gönder.

    req.body.username;
    req.body.password;
    let token = null;

    if (process.env.AUTH_MECHANISM === "token") {
      /* Burada bir unique hash oluşturacağız ve bu hash'i hem client'a göndereceğiz hem de
      sunucuda cache'leyeceğiz. Cache'lediğimizde bu hash'in hangi userid'ye ait olduğunu
      kaydetmiş olacağız. Bu sayede gelen requestin içerisinde bu hash olduğunda hangi user'a
      ait olduğunu tespit edebiliriz. Bunu yapabilmek için bize bir cache paketi lazım. */
      token = crypto.randomUUID();

      this.services.cache.setSync("auth_" + token, foundUser._id, 60 * 60 * 5);
    } else if (process.env.AUTH_MECHANISM === "jwt") {
      // TODO Handle here.
      //token = jwt.sign();
    } else {
      // TODO hata ver.
    }

    return this.showSuccess(res, {
      token,
      user: {
        username: foundUser.username,
        email: foundUser.email,
        firstname: foundUser.firstname,
        lastname: foundUser.lastname,
        gender: foundUser.gender,
      },
    });
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
      //
      const hashedPassword = await bcrypt.hash(
        req.body.password + process.env.APP_KEY,
        12
      );

      const newUser = await User.create({
        ...req.body,
        password: hashedPassword,
      });

      console.log("New user: ", newUser);

      // TODO Burada JWT oluştur ve client'a gönder

      return this.showSuccess(res, {
        username: newUser.username,
      });
    })();
  }
}
