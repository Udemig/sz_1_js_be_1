export default class BaseController {
  services = null;
  routes = {};

  constructor(services) {
    this.services = services;
  }

  showError(res, errorMessage) {
    res.json({
      status: "error",
      errorMessage,
    });
  }

  showSuccess(res, data) {
    res.json({
      status: "success",
      data,
    });
  }

  /* httpServer parametresine express server objesi gelecek. Bu sayede şuanki class için
  gerekli olan route'ları express sunucusuna tanımlayabiliriz. */
  registerRoutes(httpServer) {
    /* Yukarıdaki `routes` objesinin bütün property'lerini dizi haline çeviriyoruz. */
    const keys = Object.keys(this.routes);
    //console.log(">>>  keys:", keys);

    /* Otomatik şekilde bütün route'ları express sunucusuna set ediyoruz. */
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      console.log("Endpoint: " + key);
      const method = this.routes[key];
      httpServer.use(key, (req, res) => method(req, res));
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
}
