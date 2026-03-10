# 🔖 LinkedIn Post Saver — Chrome Extension

LinkedIn postlarını tek tıkla kaydet, etiketle, organize et.

---

## 📁 Dosya Yapısı

```
linkedin-post-saver/
├── manifest.json        ← Chrome'a extension'ı tanıtır
├── content.js           ← LinkedIn sayfasına inject edilir
├── content.css          ← Buton ve toast stilleri
├── background.js        ← Service worker (silme, etiket işlemleri)
├── popup/
│   ├── popup.html       ← Extension popup arayüzü
│   └── popup.js         ← Popup logic
└── icons/               ← 16, 48, 128px icon dosyaları (kendin ekle)
```

---

## 🚀 Chrome'a Yükleme (Dev Mode)

1. Chrome'da `chrome://extensions/` adresine git
2. Sağ üstten **"Developer mode"** aç
3. **"Load unpacked"** butonuna tıkla
4. `linkedin-post-saver/` klasörünü seç
5. Extension yüklendi! LinkedIn'e git ve postları test et.

---

## 🔧 İkon Ekleme

`icons/` klasörüne şu dosyaları ekle:
- `icon16.png`  (16×16px)
- `icon48.png`  (48×48px)
- `icon128.png` (128×128px)

> Hızlı test için: https://favicon.io adresinden basit bir ikon oluştur.

---

## 📋 Hafta 1 Checklist

- [x] manifest.json
- [x] content.js (post yakalama + Kaydet butonu)
- [x] content.css (buton stilleri)
- [x] background.js (service worker)
- [x] popup.html + popup.js (arayüz)
- [ ] icon dosyaları ekle
- [ ] LinkedIn'de test et

---

## ⚠️ Bilinen Durumlar

LinkedIn DOM yapısı zaman zaman değişebilir.
Eğer "Kaydet" butonu görünmüyorsa şunları kontrol et:

1. `content.js` içindeki `POST_SELECTOR` class adını güncelle:
   - F12 → LinkedIn akışında bir postun üstüne sağ tıkla → "İncele"
   - Ana wrapper class'ı bul (genellikle `.feed-shared-update-v2`)

2. Butonun eklendiği `actionBar` selector'ını güncelle:
   - `.feed-shared-social-action-bar` class'ını kontrol et

---

## 💰 Hafta 3'te Eklenecekler

- Supabase Auth (Google ile giriş)
- Cloud sync (postlar cihazlar arası)
- 20 post limiti → Premium bypass

---

## 📞 Sorun mu var?

`content.js` içindeki `console.log` satırlarını incele:
- F12 → Console → "LinkedIn Post Saver" filtrele
