# Notlar / Yapılacaklar

## Onaylanan

- [ ] **Üstünü çiz aracını gerçek bir "silme çizgisi" yap**
  Şu an `strike` aracı Serbest Çizim'in birebir aynısı (kod: `render.js` → `drawPath`, `state.js` → `makeAnn`).
  - Sürükleyince **dümdüz yatay** çizgi; el titrese de yamulmaz.
  - Varsayılan **kırmızı ve kalın** (yazının üstünden geçen silme çizgisi gibi).
  - `Shift` basılıyken eğik çizgiye izin ver.
  - README'deki "Kalın vurgulu çizim" açıklamasını güncelle.

## Fikirler (değerlendirilecek)

### Görseller serbest olduğu için
- **Kilitle:** Görseli (veya herhangi bir öğeyi) kilitle; seçilip yanlışlıkla kaydırılamasın. Katmanlar listesinde kilit simgesi.
- **Otomatik diz:** Seçili görselleri tek tıkla ızgara / alt alta / yan yana hizala, aralarını eşitle.
- **Kenara yapışma:** Görsel taşınırken diğer görsellerin kenarlarına ve hizasına mıknatıs gibi otursun.
- **Görsel başlığı:** Her görselin altına küçük bir açıklama ("Adım 2 – Kaydet sonrası").

### İşaretleme
- **Büyüteç:** Küçük bir alanı büyütüp yanında göster (ince çizgiyle bağlı).
- **Spotlight / karartma:** Seçilen alan dışındaki her şeyi karart, göz doğrudan hataya gitsin.
- **GEÇTİ / KALDI damgası:** Tek tıkla yeşil "GEÇTİ" veya kırmızı "KALDI" damgası.
- **Konuşma balonu:** Ok + metin tek öğe (callout).

### Raporlama
- **Adımları metin olarak kopyala:** Numara notlarını Jira/Teams'e yapıştırılacak numaralı liste olarak panoya kopyala (görsel + metin birlikte).
- **Sayfalar:** Bir projede birden fazla sayfa (her test adımı bir sayfa); hepsini tek PDF olarak indir.
- **Dosya adına test ID:** PNG adı `TC-123-...png` gibi proje adından/ID alanından gelsin.
