# UAT Görsel İşaretleyici (screenshot-annotator)

> **Canlı (kurulumsuz):** https://yigitteroll.github.io/uataraci/
> **Tek dosya:** https://yigitteroll.github.io/uataraci/dist/screenshot-annotator.html

UAT testlerinde ekran görüntüleri üzerine hızlıca işaretleme yapmak için tarayıcı tabanlı, bağımlılıksız bir araç. Kurulum ve build gerektirmez; projeler tarayıcının yerel deposunda (**IndexedDB**) saklanır.

## Çalıştırma

`index.html` dosyasına **çift tıklayın** — hepsi bu. Kurulum, sunucu veya internet gerekmez; tamamen offline çalışır.

> Not: "Panodan Yapıştır" butonu bazı tarayıcılarda izin isteyebilir; sorun olursa doğrudan `Ctrl+V` kullanın (her zaman çalışır).

### Başka bilgisayarda kullanma
1. `screenshot-annotator` klasörünü (veya zip'ini) diğer PC'ye kopyalayın.
2. `index.html`'e çift tıklayın.

Kayıtlar tarayıcının yerel deposunda (IndexedDB), yani o bilgisayara/tarayıcıya özeldir. Çalışmanızı taşımak için bir PC'de **⋯ → JSON olarak kaydet**, diğerinde **⋯ → JSON yükle** yapın (veya PNG indirin).

### E-posta / Gmail ile gönderme
Gmail, **içinde `.js` bulunan `.zip`** dosyalarını güvenlik nedeniyle engeller. Bunun yerine:

1. **Tek dosya HTML (önerilir):** klasörde `node build-standalone.js` çalıştırın; oluşan **`dist/screenshot-annotator.html`** dosyasını e-posta ile gönderin. Alıcı çift tıklayıp kullanır (`.html` Gmail'de engelli değildir).
2. **Google Drive:** klasörün tamamını Drive'a yükleyip paylaşım bağlantısını gönderin (Drive dosyaları ek taramasına takılmaz).
3. **Yeniden adlandırma:** zip'i `screenshot-annotator.zip.txt` olarak kaydedip gönderin; alıcı indirdikten sonra adı tekrar `.zip` yapar.


## Görsel yükleme
- **Görsel Aç** ile dosya seç
- **Ekran Görüntüsü** ile ekran / pencere / sekme seçip anlık görüntü al (tarayıcı izin ister)
- Sürükle-bırak
- **Ctrl+V** ile panodan ekran görüntüsü yapıştır

## İki görsel (karşılaştırma)
- Üst bardaki **2. Görsel** butonuyla ikinci görseli ekleyin; başlangıçta yan yana gösterilir.
- Zoom ve kaydırma ikisinde **senkron** çalışır.
- **Serbest konum:** sağ panelde **Taşı** düğmesini (veya **M** tuşu) açıp ikinci görselin üzerinde sürükleyin. **Yan yana** ve **Üst üste** düğmeleriyle hızlı konumlandırın.
- Üst üste bindirip **opaklık** kaydırıcısıyla iki sürümü karşılaştırabilirsiniz.
- Her görselin **kendi işaretlemeleri** vardır; hangi panelde çizerseniz o panelin katmanlarına eklenir. Katmanlar başlığındaki **1 / 2** düğmeleriyle aktif paneli değiştirin.
- Aktif panele görsel yüklemek için dosya / sürükle-bırak / **Ctrl+V** / **Ekran Görüntüsü** kullanın. İkinci görseli kaldırmak için **⋯ → 2. görseli kaldır**.
- **PNG İndir**, iki görseli konumlarına göre kapsayan **tek görsel** olarak verir.

## Araçlar
| Tuş | Araç | Açıklama |
|-----|------|----------|
| V | Seç / Taşı | Öğe seç, taşı, köşe tutamaçlarından boyutlandır |
| C | Kırp | Seçilen bölgeyi yeni görsel yapar |
| A | Ok | Yönlü ok |
| L | Çizgi | Düz çizgi |
| P | Serbest Çizim | Kalem |
| S | Üstünü Çiz | Kalın vurgulu çizim |
| R | Dikdörtgen | Çerçeve |
| E | Elips | Oval |
| H | Vurgu | Yarı saydam fosforlu |
| B | Bulanık / Mozaik | Hassas bilgiyi gizleme |
| T | Metin | Serbest yazı (arka plan seçenekli) |
| K | Etiket | Pill etiket |
| X | Çarpı | Kırmızı X rozeti (yanlış/hata) |
| Y | Tik | Yeşil ✓ rozeti (doğru/geçti) |
| G | Pin | Konum iğnesi |
| N | Numara | 1, 2, 3… otomatik artan rozet |
| U | Ölçüm | İki nokta arası px ölçüsü |

### Metin düzenleme
- **Yerleştirirken:** metin, yazı boyutu ve arka plan (Yok / Renkli / Koyu / Açık) seçilir.
- **Sonradan:** mevcut metin/etikete **çift tıklayın**; pencere açılır, canlı önizlemeyle düzenleyin. `Vazgeç` değişiklikleri geri alır.
- Metinler çok satırlıdır (`Shift+Enter` yeni satır).

## Kısayollar
- `Ctrl+Z` geri al, `Ctrl+Y` / `Ctrl+Shift+Z` ileri al
- `Delete` seçiliyi sil, `Ctrl+A` tümünü seç
- `Ctrl+S` kaydet (otomatik kayıt zaten açık), `Ctrl+Shift+S` PNG indir, `[` `]` çizgi kalınlığı
- Tekerlek ile yakınlaştır; **Space+sürükle**, **orta tuş** veya **Kaydır (el) aracı** ile gezin
- `Esc` seçimi bırakır; seçim yoksa Seç aracına döner

## Taşıma / düzenleme
- Çizdikten sonra **araç aktif kalır**, arka arkaya çizebilirsiniz; yeni öğe seçili gelir, renk/kalınlık hemen ona uygulanır. Taşımak için öğeye tıklayın (Seç aracına geçer) veya `V` / `Esc`. Eski davranış için sağ paneldeki **"Çizdikten sonra Seç aracına geç"** kutusunu açın.
- Herhangi bir öğeyi taşımak için **V** ile Seç aracına geçip öğenin üzerine tıklayıp sürükleyin.
- **Boyutlandırma tüm öğelerde çalışır:** dikdörtgen/elips/vurgu/blur kenar-köşe tutamaçlarıyla; ok/çizgi uç noktalarından; metin/etiket, serbest çizim, çarpı/tik, pin ve numara ise **köşe tutamaçlarından oransal** büyütülüp küçültülür.

## Kolaylıklar
- **Adımlar / Notlar:** Numaralı rozetler sağ panelde listelenir; her birine açıklama yazın. Rozete tıklayınca o adıma **zoomlanır**.
- **Seçili alanı indir:** **⋯ → Seçili alanı PNG indir** (veya öğeye sağ tık) ile yalnızca seçili öğelerin bölgesini PNG olarak alın.
- **Cetvel & Izgara:** **⋯** menüsünden açıp kapatın; piksel-hassas yerleştirme için.
- **Ölçüm aracı:** İki nokta arasını sürükleyin; genişlik × yükseklik ve mesafeyi px olarak gösterir.
- **Çoklu seçim:** Seç aracında boş alanda **sürükleyerek** kutu çizin (Shift ile mevcut seçime ekler); kutuya giren tüm öğeler seçilir, birlikte taşınır/silinir.
- **Tema:** Üst bardaki düğmeyle **Sistem / Açık / Koyu**; "Sistem" seçiliyken tarayıcı tercihini otomatik izler.
- **Sağ tık:** öğede → *Çoğalt / Metni düzenle / Öne getir / Arkaya gönder / Sil*; boş alanda → *Panodan Yapıştır / Görsele sığdır / %100*.
- **Geri Al bildirimi:** silme, kırpma ve görsel değiştirme sonrası alttaki şeritten tek tıkla geri al. Yeni görsel yapıştırmak işaretlemeleri kalıcı olarak silmez; `Ctrl+Z` ile eski görsel ve işaretlemeler geri gelir.
- **Durum çubuğu ipucu:** seçili aracın nasıl kullanılacağını gösterir.
- **Otomatik dosya adı:** `proje-yyyymmdd-hhmmss.png`.
- **İlk kullanım şeridi:** Görsel al → İşaretle → Paylaş.
- Fare ile bir öğenin üzerine gelince hafif vurgu.

## Çıktı
- **PNG İndir**: işaretlemeler görsele gömülü PNG
- **Kopyala**: sonucu panoya görsel olarak kopyala (Jira/Teams'e yapıştır)
- **JSON olarak kaydet / yükle**: yeniden düzenlenebilir proje

## Projeler
Üstteki **Projeler** menüsünden kayıtlı projelere geçin, silin veya yeni boş proje açın. Görsel + işaretlemeler otomatik olarak `localStorage`'a kaydedilir.

### Depolama notu
Projeler **IndexedDB**'de saklanır (tarayıcıya göre GB mertebesinde yer). Eski sürümden kalan `localStorage` kayıtları ilk açılışta **otomatik taşınır**. Tarayıcı IndexedDB desteklemiyorsa otomatik olarak `localStorage`'a geri düşer. Kayıt sırasında görseller büyükse otomatik **JPEG'e çevrilip** (uzun kenar en fazla 2600 px) küçültülür. Yedek almak için **JSON olarak kaydet** kullanın.

## Dosya yapısı
```
screenshot-annotator/
  index.html      arayüz
  styles.css      tema
  js/state.js     durum, IndexedDB, sıkıştırma
  js/geometry.js  bbox, isabet testi, taşı/boyutlandır
  js/render.js    canvas çizimi, blur/mozaik
  js/export.js    PNG/JSON dışa aktarım
  js/tools.js     araç etkileşimleri
  js/ui.js        araç çubuğu, panel, proje yönetimi
  js/main.js      başlatma
```
