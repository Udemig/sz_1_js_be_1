export default class BaseController {
  services = null;
  httpRoutes = {};
  websocketRoutes = {};

  constructor(services) {
    this.services = services;
  }

  showError(res, errorMessage) {
    res.json(this.getErrorJson(errorMessage));
  }

  showSuccess(res, data) {
    res.json(this.getSuccessJson(data));
  }

  getErrorJson(errorMessage) {
    return {
      status: "error",
      errorMessage,
    };
  }

  getSuccessJson(data) {
    return {
      status: "success",
      data,
    };
  }

  /* httpServer parametresine express server objesi gelecek. Bu sayede şuanki class için
  gerekli olan route'ları express sunucusuna tanımlayabiliriz. */
  registerHttpRoutes(httpServer) {
    /* Yukarıdaki `routes` objesinin bütün property'lerini dizi haline çeviriyoruz. */
    const keys = Object.keys(this.httpRoutes);
    //console.log(">>>  keys:", keys);

    /* Otomatik şekilde bütün route'ları express sunucusuna set ediyoruz. */
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      console.log("HTTP Endpoint: " + key);

      if (!key.startsWith("/")) {
        throw new Error("This route must start with slash: " + key);
      }

      const method = this.httpRoutes[key];

      /* Burası route'ları register ettiğimiz yer. Methodlardan bir hata fırlatıldığında
      eğer bunu yakalamazsak (catch etmezsek) o zaman program komple çöküyor. Bu problemden
      kurtulmak için methodlardan fırlatılan hataları bir şekilde yakalayıp loglamak ve
      client'a hata mesajını göstermek gerekir. Böylece program çökmemiş olur. Bu işlemi
      yapmak için iki yöntem var. Birinci yöntem try-catch bloğunu aşağıda kurgulamak.
      İkinci yöntem ise genel bir exception handler middleware oluşturup express'e tanımlamak.
      Birinci yöntem biraz amatör bir yöntem olacağından dolayı ikinci yöntemi tercih edeceğiz.
      Çünkü ikinci yöntemde ayrıca express'i daha efektif kullanmış oluruz. */
      httpServer.use(key, async (req, res) => {
        //method(req, res);

        try {
          await method(req, res);
        } catch (e) {
          console.error("An error occured: ", e);

          res.json({
            status: "error",
            errorMessage: e.message,
          });
        }
      });
    }

    /* Eğer httpServer.use() ifadesinin ikinci parametresine şuanki class'ın methodunu
    doğrudan verirsek express bu methodu objenin içerisinden çıkarıyor. Bu durumda
    method içerisinde `this` keywordü kullanılamaz hale geliyor. Bu problemden
    kaçınabilmek için `use()` fonksiyonunun ikinci parametresine single line arrow
    function yazıyoruz ve class içerisindeki methodu kendimiz invoke ediyoruz. Böylece
    ilgili method kendi class'ından ayrılmamış oluyor. */

    // Hatalı kullanım:
    // httpServer.use("/room/join", this.join);

    // Doğru kullanım:
    //httpServer.use("/room/join", (req, res) => this.join(req, res));
  }

  registerWebsocketRoutes(routesObj) {
    const keys = Object.keys(this.websocketRoutes);

    /* Otomatik şekilde bütün route'ları websocket sunucusuna set ediyoruz. */
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      console.log("WS Endpoint: " + key);

      /* `routesObj` datası obje referansı şeklinde geleceği için bu değişken
      üzerinde doğrudan değişiklik yapabiliriz. Dolayısıyla tüm controllerların
      route'ları websocket-server-service dosyası içerisinde kayıtlı olacak. */
      routesObj[key] = this.websocketRoutes[key];
    }
  }
}
