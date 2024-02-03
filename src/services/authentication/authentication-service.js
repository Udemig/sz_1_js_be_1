import bcrypt from "bcrypt";
import { User } from "../../models/user.js";

export class AuthenticationService {
  services = null;

  constructor(services) {
    this.services = services;
  }

  async login(username, password) {
    /* Raw passwordü (ham şifreyi) doğrudan hashlersek bu bir tık güvenlik zaafiyeti
    oluşturabilir. Çünkü kullanıcılar tembeldir ve karmaşık şifreler kullanmazlar.
    Çoğunlukla validasyonu geçecek ama aslında hala basit olan ve tahmin edilebilir
    olan şifreler kullanırlar. Eğer bu şekilde gelen şifreyi hashlersek o zaman saldırganlar
    hala kullanıcıların hesaplarını ele geçirebilir. Bu problemden kurtulmak için
    şifreleri tuzlayarak (salt) hashlememiz gerekiyor. Bunu nasıl yapacağız? Private
    bir key'i şifrelerin sonuna ekleyip o şekilde hashleyeceğiz. O zaman saldırganlar
    veritabanını ele geçirse bile bizim kendi gizli key'imizi bilmedikleri için kimsenin
    şifresine ulaşamazlar. */
    const foundUser = await User.findOne({ username });

    if (
      !foundUser ||
      !bcrypt.compareSync(password + process.env.APP_KEY, foundUser.password)
    ) {
      throw new Error("Kullanıcı bulunamadı, lütfen şifrenizi kontrol ediniz.");
    }

    // JWT bilgisini oluştur ve client'a gönder.

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
      throw new Error("JWT henüz implement edilmedi.");
    } else {
      throw new Error("Auth mekanizması belirlenmedi.");
    }

    return {
      token,
      user: {
        username: foundUser.username,
        email: foundUser.email,
        firstname: foundUser.firstname,
        lastname: foundUser.lastname,
        gender: foundUser.gender,
      },
    };
  }

  async register(input) {
    //
  }

  async logout(hash) {
    //
  }
}

export default AuthenticationService;
