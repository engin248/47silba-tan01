# KARARGAH RAPORLARI & ZEKASI (M15) — Detaylı Sayfa Analizi
**Rota:** `/raporlar` | **Dosya:** `src/features/raporlar/components/RaporlarMainContainer.js`  
**Toplam:** 546 satır  
**Görev:** Fabrikanın kümülatif durumunu, gelir/gider, sipariş analizi ve tüm üretim karnesini "Recharts" kütüphanesi ile grafiklere dökmek.

---

## ✅ MEVCUT NE VAR (koddan satır satır doğrulandı)

| Bileşen | Durum | Kod Referansı |
|---------|-------|---------------|
| Recharts Line/Bar/Pie Grafik motoru | VAR | satır 9-11 |
| Tarihsel Filtreleme Sistemi (Gte/Lte) | VAR | satır 87-90 |
| Ciro, Üretim ve Maliyet KPI Kartları | VAR | satır 112 |
| Supabase 8 Tablodan Promise Array Çekimi | VAR | satır 94-102 |
| Personel P&L (Devamlılık ve Maaş) Formülleri | VAR | satır 135-151 |
| CSV İndirme Yeteneği (csvIndir) | VAR | satır 18-30 |

---

## ❌ EKSİK BİLGİ AKIŞLARI — DETAYLI

### 1. BÜYÜK RAPORLAMA HATASI: LIMIT 200 VE PAGINATION KOPUKLUĞU

**Kritik Sorun (satır 97, 99, 100 vs):**
```js
tarihFiltre(supabase.from('b2_siparisler').select(...)).order('created_at').limit(200),
supabase.from('b1_muhasebe_raporlari').select('*').limit(200),
```
Fabrikada 250 sipariş girilirse, Rapor ekranı ilk 200 tanesini çekecektir. Geri kalan 50 siparişin geliri kümülatif **TOPLAM CİRO** grafiğinde veya hesaplamalarında yer almaz. Raporda 200 limit ile veri çekilip front-end'de reduce (toplama) yapılması matematiği (Mali Raporu) direkt hatalı ve yalan veri haline getirir. **Bunun yerine Supabase'de bir SQL View veya RPC fonksiyonu yazılıp, veritabanı tarafında 10.000 kayıt toplanarak "Tek Numara" olarak web sitesine gelmeliydi.** Ciro şu an yanlış hesaplanmaya mahkum.

### 2. KASA & GİDER RAPORSUZLUĞU

Raporlar sayfası gelir için `b2_siparisler` tablosundaki tutarı kullanıyor (`tarihFiltre(supabase.from('b2_siparisler').select('durum,toplam_tutar_tl')).limit(200)`).
Fakat "Bu siparişin ne kadarı Kasa'ya tahsil edildi?" diye bakmıyor. P&L (Kâr/Zarar) yaparken, Müşteri borcunu ödememiş olsa da Sipariş tablosunda teslim edildi gözüktüğü için "Biz kârdayız" grafiği çiziliyor. Kasa (Tahakkuk değil Tahsilat) raporlaması YOK.

---

## ❌ EKSİK ENTEGRASYONLAR

| Kaynak | Hedef | Durum | Sorun |
|--------|-------|-------|-------|
| Kasa Tahsilatı | Raporlar | YOK | Sipariş değerine göre hayali ciro yazılıyor, fiili ciro değil. |
| SQL Toplamları | Frontend Rap. | YOK | Veriler istemci tarafına indirilip toplanıyor (Çökmeye elverişli) |

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] **PowerBI / Tableau API Bağlantısı** → Yönetimin cep telefonundan devasa verileri canlı okuması için dış veri ambarı (Data Warehouse) çıkışı.
- [ ] **Yapay Zeka CFO** → Veriler okunduktan sonra ekranda grafikten ziyade "Son 2 aydır işçilik giderleri kumaş giderlerini %14 aştı, darboğaz var" diye cümle kuran asistan.
