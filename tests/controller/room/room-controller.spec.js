import { mongoMocker, servicesMocker } from "../../utils/mocker.js";

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

  /* Bir room'daki kullanıcı mesaj olarak şu metni gönderebilir:
  `<script>alert(document.cookie)</script>`

  Görüldüğü üzere eğer bu datayı gönderirse ve bu data diğer clientlar tarafından
  gerçekten de bir javascript kodu olarak zannedilip çalıştırılırsa bu büyük bir
  zaafiyet demektir. Çünkü saldırgan room'daki herkesin çerezlerine ulaşabiliyor
  ve bununla istediği şeyi yapabilir (bu çerezleri kendi sitesine gönderebilir).
  Dolayısıyla bütün kullanıcıların hesapları çalınabilir.

  Böyle bir durum olmaması için html karakterlerinin encode'lanması gerekiyor. Html
  içerisinde bazı karakterlerin güvenli şekilde gösterilmesi için bir karakter kodlaması
  mevcuttur. Bu kodlama kısaca şu şekildedir:

  Özel karakter         Güvenli encoding karşılığı
  -------------         --------------------------
  <                     &lt;
  >                     &gt;
  '                     &#39;
  "                     &#34;

  Burada görüldüğü üzere sol taraftaki tehlikeli karakterlerin sağ taraftaki güvenli
  karşılıklarına replace edilmesi gerekiyor. Room controller'ın sendMessage() fonksiyonunun
  bu işlemi yaptığından emin olmamız için test yazalım.
  
  Bu konu ödev olsun.
  */
  it("should encode html characters", async () => {
    expect(true).toBe(true);
  });
});
