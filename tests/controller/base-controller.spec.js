import BaseController from "../../src/controller/base-controller.js";

/* Express'e route register yaparken route'ların slash ile başlama zorunluluğu
vardır. Çünkü slash ile başlamayan route'lar express tarafından tanınmıyor ve
express bu durumda hata da vermiyor. Bundan dolayı biz route'ı register ettiğimizi
zannederken aslında express tarafında register olmuyor. Bu problemi kontrol
altında tutmak için controllerlardaki `httpRoutes` property'sinin keylerinin
(bunlar bizim route'larımız) slash ile başlayıp başlamadığını kontrol ettiriyoruz.
Eğer slash ile başlamayan bir key varsa error throw etmesi gerekiyor. İşte bu
kuralın testini aşağıda yazdık. */
test("registerHttpRoutes() function check all routes start slash", async () => {
  /* Öncelikle sahte bir controller class'ı oluşturalım. Böylece `httpRoutes`
  property'sini set edebiliriz. Ardından bu class'tan yeni bir instance
  oluşturup `registerHttpRoutes()` methodunu invoke ediyoruz. Bu method 'foo/foo'
  adresini görünce hata fırlatmasını bekliyoruz. */
  class ExampleClass extends BaseController {
    httpRoutes = {
      // hem hatalı hem doğru olan route'ları buraya yaz.
      "foo/foo": () => {},
      "/bar/bar": () => {},
    };
  }

  const dummyServer = {
    use: (route, callback) => {
      console.log(">> 🚀 route:", route);
      console.log(">> 🚀 callback:", callback);
      console.log("---------------------");
    },
  };

  const foo = new ExampleClass();
  try {
    // Burada hata fırlatması gerekiyor. Fırlatılan hata catch kısmında yakalanıyor
    // ve gelen hata mesajı kontrol ediliyor.
    foo.registerHttpRoutes(dummyServer);

    // Eğer bu satıra gelirse hata fırlatmamış demektir, bu da bizim istediğimiz
    // bir durum değil. Çünkü ilk route'ta hata fırlatmasını istiyoruz.
    // Neden hata fırlatmalı? Çünkü bu route geçerli bir route değil.
    expect(true).toBe("It must throw an error");
  } catch (e) {
    expect(e.message).toBe("This route must start with slash: foo/foo");
  }
});

test("base controller test 2", () => {
  console.log("Base controller test executed.");
});

test("base controller test 3", () => {
  console.log("Base controller test executed.");
});

test("base controller test 4", () => {
  console.log("Base controller test executed.");
});
