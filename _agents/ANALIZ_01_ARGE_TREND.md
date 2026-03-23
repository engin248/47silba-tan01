# AR-GE & TREND SAYFASI ANALİZİ
> Tarih: 17 Mart 2026 | Kaynak: Kullanıcı Analizi + Mühendis Notları

---

## MEVCUT DURUM ANALİZİ

Arayüz temiz ama boş veri → karar verdirmez

"Ajan / Trend keşfi" var ama çıktı yok

"0 kayıt" → sistem çalışmıyor veya veri akmıyor

Sağ panel hataları (CORS / 522) → veri çekilemiyor → kritik hata

→ SONUÇ: İstihbarat değil, sadece kabuk

---

## BU SAYFA NE OLMALI (GERÇEK ROL)

Bu sayfa:
→ Trend bulmaz → **Trend avlar**
→ Veri göstermez → **Karar üretir**

---

## OLMASI ZORUNLU ÇEKİRDEK BLOKLAR

### A) CANLI TREND AKIŞI (EN ÜST)
- Son 24 saat yükselen ürünler
- Trend skor (0–100)
- Artış yüzdesi
→ "şu an ne patlıyor" tek bakış

### B) TREND RADARI (ZAMAN SERİSİ)
- Ürün bazlı grafik (günlük artış)
- Pik / düşüş noktası
→ geç mi erken mi net görülmeli

### C) SOSYAL + PAZAR YERİ EŞLEŞME
- TikTok viral → Trendyol satış var mı?
- Video → sepete etkisi
→ SAHTE TREND FİLTRESİ

### D) OTOMATİK SKOR PANELİ
- Talep
- Viral
- Dönüşüm
- Rekabet
- Risk
→ Tek skor: **"SATAR / SATMAZ"**

### E) ERKEN TREND TESPİT
- Düşük rekabet + hızlı artış → "ERKEN GİR" etiketi

### F) TREND HARİTASI (KATEGORİ)
- Hangi kategori yükseliyor → sadece ürün değil, yön gösterir

### G) KARAR PANELİ (EN KRİTİK)
- Her ürün için: Skor · Risk · Fiyat önerisi · Satış tahmini
→ Çıktı: **ÜRET · GİR · BEKLE · İPTAL**

### H) AJAN LOG (AMA GERÇEK)
- Ne taradı · Neyi eledi · Neyi seçti · Neden seçti
→ şeffaflık

---

## ŞU ANKİ SAYFADAKİ KRİTİK EKSİKLER

❌ Gerçek veri yok
❌ Skor yok
❌ Trend listesi yok
❌ Karar yok
❌ Filtre yok
❌ Zaman grafiği yok
❌ Sosyal bağlantı yok
❌ Hata var (veri akmıyor)

---

## KRİTİK HATA

Sağdaki log: CORS error · 522 error

→ Bu şu demek: Sistem veri çekemiyor → tüm analiz çökmüş
→ ÖNCELİK: API erişim düzelt → Veri akışını çalıştır → Sonra UI

---

## DÜNYA STANDARDI REFERANS

Bu sayfa = birleşimi olmalı:
Google Trends (trend yön) · TikTok Creative Center (viral) · Amazon Best Sellers (satış doğrulama) · Shopify Analytics (dönüşüm)

---

## SON NET DEĞERLENDİRME

- Tasarım: ✔ iyi
- Sistem mantığı: ✔ doğru
- Veri: ❌ yok
- Karar üretimi: ❌ yok

**KESİN SONUÇ:** Bu sayfa şu an dashboard → Olması gereken: istihbarat merkezi

Gereken dönüşüm: **veri → analiz → skor → karar**

---

## YAPILACAKLAR ÖNCELİK SIRASI

| Blok | Öncelik |
|------|---------|
| D - SATAR/SATMAZ Skor | 🔴 KRİTİK |
| A - Canlı Trend Akışı | 🔴 KRİTİK |
| G - Karar Paneli | 🔴 KRİTİK |
| H - Ajan Log (şeffaf) | 🟡 ÖNEMLİ |
| B - Trend Radar Grafiği | 🟡 ÖNEMLİ |
| C + E + F | 🟢 SONRA |
