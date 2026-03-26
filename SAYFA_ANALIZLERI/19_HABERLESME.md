# HABERLEŞMEi — NIZAM İÇ MESAJLAŞMAi (M19) — Detaylı Sayfa Analizi
**Rota:** `/haberlesme` | **Dosya:** `src/features/haberlesme/components/HaberlesmeMainContainer.js`  
**Toplam:** 968 satır  
**Görev:** Fabrika içi güvenli, şifreli, sha-256 damgalı mesajlaşma sistemi. Model koduna bağlı referans mesajlar.

---

## ✅ MEVCUT NE VAR (koddan satır satır doğrulandı)

| Bileşen | Durum | Kod Referansı |
|---------|-------|---------------|
| `b1_ic_mesajlar` tablosu | VAR | satır 145 |
| 5 Sekme (Gelen/Gönderilenler/Arşiv/Çöp Kovası/Yeni Mesaj) | VAR | satır 583-595 |
| **AES-256-GCM şifreli mesaj içeriği** | VAR | satır 278 |
| **SHA-256 bütünlük damgası** | VAR | satır 268-271, 283 |
| Şifreli içerik görüntüleyici (`CozulmusIcerik`) | VAR | satır 75-86 |
| Model listesinden ürün bağlantısı (ZORUNLU) | VAR | satır 259-260, 616-632 |
| Model kodu prefix otomatik ekleme | VAR | satır 274-275 |
| Model fotoğrafı snapshot (urun_kodu + urun_adi) | VAR | satır 294-296 |
| Yanıt mekanizması (RE: prefix + yanit_id FK) | VAR | satır 444-456 |
| Onay mekanizması (onay_bekleniyor tip) | VAR | satır 470-492 |
| Onay/Red kararı → b0_sistem_loglari | VAR | satır 482-487 |
| Çöpe at (soft-delete copte=true + cop_tarihi) | VAR | satır 396-399 |
| Çöpten geri al (sadece koordinatör) | VAR | satır 418-432 |
| Çöp kovası bilgi bandı (45 gün uyarısı) | VAR | satır 750-753 |
| **Referans nota silme matrisi** (3x2 tablo) | VAR | satır 322-341 |
| Koordinatör PIN ile referans not silme | VAR | satır 371-387 |
| b0_sistem_loglari kara kutu yazımı | VAR | satır 401-408 |
| **Sesli dikte** (Web Speech API, Türkçe) | VAR | satır 209-230 |
| Fotoğraf eklenti placeholder | VAR | satır 684-687 |
| 3 Öncelik (Normal/Acil/Kritik) | VAR | satır 37-41 |
| Kritik/Acil → Telegram bildirimi | VAR | satır 302-310 |
| 5 Mesaj tipi (bilgi/görev/onay/şikayet/rapor) | VAR | satır 43-49 |
| Okundu damgası (okundu_at + durum: okundu) | VAR | satır 241-254 |
| Okunmamış mesaj sayacı | VAR | satır 196-201 |
| Okunmamış alert banner (titreyen) | VAR | satır 524-535 |
| 11 Modül kanalı (kesim/üretim/kalıp/kasa/...) | VAR | satır 23-35 |
| Üretim birimlerine model geçmişi erişimi | VAR | satır 69-72 |
| Tam arşiv yetkisi (koordinatör/yönetim) | VAR | satır 67, 114 |
| Öncelik filtresi | VAR | satır 495-504 |
| Copte filtresi (çöp kovası sekme ) | VAR | satır 497-498 |
| Realtime WebSocket (b1_ic_mesajlar) | VAR | satır 128-131 |
| Alıcı ID yerine grup bazlı kimlik | VAR | satır 284 |
| Arapça RTL desteği | VAR | satır 521 |

---

## ❌ EKSİK BİLGİ AKIŞLARI — DETAYLI

### 1. FOTOĞRAF EKLEME — PLACEHOLDER, GERÇEK DEĞİL

**Sorun (satır 684-687):**
```jsx
<button onClick={() => setForm(p => ({...p, 
  icerik: p.icerik + '\n\n[📸 Eklenti: Fotoğraf_numune.jpg (Bulut Depolama Devre Dışı Koruması)]'
}))}>
    <Camera size={14} /> Foto Ekle
</button>
```
"Foto Ekle" butonu gerçek dosya yüklemiyor — metne bir placeholder satır ekliyor. **Supabase Storage entegrasyonu yok.** Kumaş rengi, kalıp sorunu, üretim defekti gibi durumlarda görsel iletişim mümkün değil.

### 2. MESAJ DÜZENLEMESİ MÜMKÜN DEĞİL (TASARIM KARARI)

Satır 605: "Gönderildikten sonra içerik değiştirilemez." — bu bilinçli bir tasarım kararı (SHA-256 bütünlüğü). Ancak yazım hatası gibi masum durumda yönetici bile düzenleyemiyor — yalnızca sil ve tekrar gönder.

### 3. ÇÖP KUTUSU OTOMATIK TEMİZLEME — SADECE UYARI, KOD YOK

**Satır 752:** "45 gün sonra kalıcı olarak silinecektir" yazıyor ama bu otomatik temizleme için bir cron job yok (`vercel.json`'da `cron`). 45 gün geçince kayıtlar Supabase'de duruyor.

### 4. GONDEREN_ID — UUID YOK, GRUP BAZLI

**Satır 284:**
```js
gonderen_id: null, // PIN sistemi UUID üretmiyor — grup bazlı kimlik
```
`gonderen_id` her zaman null. "Kim gönderdi?" sorusu `gonderen_adi` (serbest metin) ile yanıtlanıyor. Bir kişi herhangi bir adı yazabilir — sahtecilik mümkün.

### 5. HABERLEŞMEi → GÖREVLER KÖPRÜSÜ YOK

"Görev Talebi" tipinde mesaj gönderilebiliyor ama bu mesaj otomatik olarak `b1_gorevler` tablosuna görev oluşturmuyor. İki sistem arasında köprü yok.

---

## ❌ EKSİK ENTEGRASYONLAR

| Kaynak | Hedef | Durum | Sorun |
|--------|-------|-------|-------|
| Mesaj "Görev Talebi" → b1_gorevler | YOK | Manuel iş akışı |
| Foto eklenti → Supabase Storage | YOK | Placeholder metin |
| Çöp kovası → Otomatik 45 gün | YOK | Cron yok |
| Mesaj → OKuyan kişi profili | YOK | gonderen_id null |
| Acil mesaj → Sesli uyarı | YOK | Sadece banner |

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] **Gerçek dosya yükleme** → Supabase Storage (kumaş fotoğrafı, kalıp çizimi)
- [ ] **Sesli mesaj kaydı** → 30sn ses kaydı → Supabase Storage'a yükle
- [ ] **Mesaj "Görev Talebi" → otomatik görev oluşturma**
- [ ] **E2E şifreli iletişim** → Şifreleme anahtarı dışarı çıkmayacak şekilde (yerel hesaplama)
- [ ] **Mesaj okundu/okunmadı tüm alıcı bazlı takip** (şuan grup bazlı)
- [ ] **Mesaj arama** → Konu, model kodu, gönderene göre arama
