# MUHASEBE — FİNANS KİLİT & DEVİR (M8) — Detaylı Sayfa Analizi
**Rota:** `/muhasebe` | **Dosya:** `src/features/muhasebe/components/MuhasebeMainContainer.js`  
**Toplam:** 762 satır  
**Görev:** Tamamlanan üretim emirlerinden rapor oluştur, maliyet kalemlerini denetle, "2. Birime devir" ile kilitle.

---

## ✅ MEVCUT NE VAR (koddan satır satır doğrulandı)

| Bileşen | Durum | Kod Referansı |
|---------|-------|---------------|
| `b1_muhasebe_raporlari` tablosu | VAR | satır 63 |
| `production_orders` (status=completed) emir listesi | VAR | satır 66-69 |
| Rapor → b1_maliyet_kayitlari join | VAR | satır 110 |
| Rapor oluşturma (`uretimdenRaporOlustur`) | VAR | satır 195-... |
| Mükerrer rapor önleme kontrolü | VAR | satır 198-200 |
| Durum güncelleme (onaylandi/reddedildi) | VAR | satır 116-136 |
| **"2. Birime devir" kilitleme** (`kilitlendi`) | VAR | satır 162-163 |
| Devir → silmeYetkiDogrula PIN koruması | VAR | satır 141-144 |
| Devir → `b0_sistem_loglari` kara kutu | VAR | satır 156-160 |
| Devir → `MUHASEBE_STOK_DOGRULAMA` log | VAR | satır 178-184 |
| Devir → Telegram bildirimi | VAR | satır 190 |
| Rapor üzerinde zayiat düzenleme modal | VAR | satır 24-25 |
| Ek maliyet ekleme (manuel giriş) | VAR | satır 25 |
| Visibilitychange → realtime kapat/aç | VAR | satır 45-47 |
| Çevrimdışı → kuyruk (devir + durum) | VAR | satır 120-123, 147-152 |
| Çift tıklama koruması | VAR | satır 117, 139 |
| Arama metni filtresi | VAR | satır 23 |
| Arapça dil desteği | VAR | satır 16 |

---

## ❌ EKSİK BİLGİ AKIŞLARI — DETAYLI

### 1. `kilitlendi` vs `MUHASEBECI_KILITLI` — STATUS TUTARSIZLIĞI

**Sorun (satır 163):**
```js
await supabase.from('b1_muhasebe_raporlari').update({
    rapor_durumu: 'kilitlendi', ...
})
```
Muhasebe kilitlediğinde `rapor_durumu = 'kilitlendi'` yazıyor. Ancak Katalog sayfasında (`b2_urun_katalogu`) ürün için farklı bir status kodu bekleniyor olabilir — bu iki tablo arasındaki durum kodu köprüsü dokümante edilmemiş.

### 2. RAPOR OLUŞTURMA — `production_orders.status = 'completed'` KOŞULU

**Sorun (satır 68):**
```js
.eq('status', 'completed')
```
İmalat modülünde (`ImalatMainContainer.js`) bitirme kodunda `status` değeri ne yazılıyor? `'completed'` mı yoksa `'tamamlandi'` mı? İki tablonun durum enum değerleri eşleşmiyorsa rapor oluşturulacak emirler listede görünmüyor.

### 3. KASA TABLOSUYLA KÖPRÜi YOK

Muhasebe raporu onaylandığında `b2_kasa_hareketleri`'ne otomatik giriş yapılmıyor. "Ürün satıldı → kasaya para girdi" mekanizması muhasebeyi bağlamıyor. Kasa ve muhasebe bağımsız çalışıyor.

### 4. MALİYET KALEMLERİ — HESAP TUTUMU KONTROLÜ YOK

`b1_maliyet_kayitlari` üzerinden maliyetler görüntüleniyor ama:
- Toplam maliyet mi bekleniyor, satır satır mı onaylanıyor?
- Eksik maliyet kalemi uyarısı yok
- "Bu emir için fire_kaybi maliyeti hiç girilmemiş" tespiti yok

---

## ❌ EKSİK ENTEGRASYONLAR

| Kaynak | Hedef | Durum | Sorun |
|--------|-------|-------|-------|
| Muhasebe onayı → Kasa | YOK | b2_kasa_hareketleri bağlantısı yok |
| Muhasebe kilitlendi → Katalog | KISMI | Durum kodu tutarsızlığı |
| İmalat completed → Rapor listesi | KISMI | Status enum uyuşmazlığı riski |

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] **Elektronik muhasebe entegrasyonu** → e-Defter, e-Fatura
- [ ] **Otomatik kasa girişi** → Onay → Kasaya ödeme kaydı
- [ ] **Maliyet sapma analizi** → Bütçe vs gerçek otomatik
- [ ] **Dönem raporu** → Aylık/çeyrek/yıllık P&L
