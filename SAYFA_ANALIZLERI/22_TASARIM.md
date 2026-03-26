# TASARIM STÜDYOSU / CMS (M22) — Detaylı Sayfa Analizi
**Rota:** `/tasarim` | **Dosya:** `src/features/tasarim/components/TasarimMainContainer.js`  
**Toplam:** 468 satır  
**Görev:** Sitenin (özellikle karargah ve seçili sayfaların) global tema renklerini (UI) ve içerik bloklarını (dinamik duyurular) veritabanı üzerinden yönetecek CMS (Content Management System) altyapısı sağlamak.

---

## ✅ MEVCUT NE VAR (koddan satır satır doğrulandı)

| Bileşen | Durum | Kod Referansı |
|---------|-------|---------------|
| `b0_tasarim_ayarlari` Tablo Entegrasyonu | VAR | satır 181, 200 |
| Sayfa Sayfa veya "Tüm Sayfalara Canlıya Al" | VAR | satır 211, 240 |
| Canlı İframe Önizlemesi (`Target: _blank`) | VAR | satır 452-464 |
| Dinamik Blok Ekleme (Başlık, Duyuru, Ayırıcı) | VAR | satır 70-146 |
| Zengin Hazır Palet Koleksiyonu (Yeşiller/Maviler vs) | VAR | satır 14-57 |

---

## ❌ EKSİK BİLGİ AKIŞLARI / UYMSUZLUKLAR

### 1. DİNAMİK YAPI ÇÖZÜMLENMEMİŞ (MİMARİ KOPUKLUK)

Bu modül `b0_tasarim_ayarlari`na `JSON` verisi kaydediyor. Ancak ERP'nin diğer özellikleri (`ClientLayout.js`, veya modül sayfaları `KasaMainContainer.js` vb.) bu tablodan fetch atıp kendi UI renklerini değiştirecek kodlamaya sahip mi? (Şu an analiz edilen 14 ayrı sayfada `fetch('b0_tasarim_ayarlari')` tarzı bir renk hook'una hiç rastlanmadı). Sistem UI olarak muhtemelen *Tailwind Arbitrary değerlere veya Native CSS'e* hardcoded gömülü durumda, bu CMS sayfası büyük ihtimalle "Hayalet (Phantom)" bir sayfa (Kaydedip hiçbir şeyin değişmediği bir yönetim paneli).

### 2. İÇERİK BLOKLARI TEKLİ YAPI (ARRAY KOPUKLUĞU)

Tasarım modülünden bir sayfaya (örneğin `/musteriler`e) "Duyuru Kulesi: Önemli Risk Limiti Uyarısı" isimli bir bilgi kutusu atandığında, `MusterilerMainContainer.js` içerisinde bu blokları gösterecek bir `Map` fonksiyonu yok. Veri M22'den NIZAM'ın çekirdeğine yazılıyor ama okuyucu kulaklıklar takılmamış.

---

## ❌ EKSİK ENTEGRASYONLAR

| Kaynak | Hedef | Durum | Sorun |
|--------|-------|-------|-------|
| Tasarım Renkleri | Client Hook | SIFIR | Global değişkenlerin `<html>` tagına css variable olarak enjekte edilmesi yazılmamış olmalı. |
| İçerik Blokları | Modül Render | SIFIR | Haber bandı panellere gitmiyor. |

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] **Karanlık / Aydınlık Mod AI Çözücüsü** → Kullanıcının göz kırpma refleksine göre webcam okumasıyla UI temasının pastel veya dark'a otomatik geçişi.
- [ ] **Gelişmiş Widgetlar** → Kasa'ya özel "Borsa Widget'ı" gibi bileşenlerin Dashboard Builder (Drag & Drop) olarak sürüklenip bırakılması.
