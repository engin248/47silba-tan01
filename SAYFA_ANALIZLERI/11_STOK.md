# STOK DEPO KARARGAHI (M11) — Detaylı Sayfa Analizi
**Rota:** `/stok` | **Dosya:** `src/features/stok/components/StokMainContainer.js`  
**Toplam:** 458 satır  
**Görev:** Bitmiş ürün stok takibi, hareket kaydı (giriş/çıkış/iade/fire), alarm sistemi, net stok hesabı.

---

## ✅ MEVCUT NE VAR (koddan satır satır doğrulandı)

| Bileşen | Durum | Kod Referansı |
|---------|-------|---------------|
| `b2_urun_katalogu` ve `b2_stok_hareketleri` tabloları | VAR | satır 64-65 |
| Net stok hesabı (başlangıç + giriş - çıkış) | VAR | satır 72-83 |
| 4 Hareket tipi (giris/cikis/iade/fire) | VAR | satır 19 |
| `/api/stok-hareket-ekle` API route | VAR | satır 123 |
| Zod siber kalkanı (422 → hata) | VAR | satır 131 |
| Rate limit 429 koruması | VAR | satır 130 |
| Düşük stok alarm (min_stok eşiğinde) | VAR | satır 144-147 |
| Telegram ile kritik stok alarmı | VAR | satır 146 |
| Silme → b0_sistem_loglari + Telegram | VAR | satır 170-175 |
| silmeYetkiDogrula PIN koruması | VAR | satır 162-165 |
| Çift tıklama koruması | VAR | satır 37, 97 |
| Offline guard (çevrimdışı kuyruğa al) | VAR | satır 112-120 |
| Realtime WebSocket (b2_stok_hareketleri) | VAR | satır 47-51 |
| Arama filtresi | VAR | satır 36 |
| Raf konumu girişi | VAR | satır 108 |
| Arapça RTL | VAR | satır 190 |
| `sayfaErisim('/stok')` yetki kontrolü | VAR | satır 23 |

---

## ❌ EKSİK BİLGİ AKIŞLARI — DETAYLI

### 1. NET STOK HESABI — ÇİFT SAYIM SORUNU

**Sorun (satır 80-82):**
```js
const baslangicStok = u.stok_adeti || 0;
return { ...u, net_stok: baslangicStok + totalGiris - totalCikis };
```
`stok_adeti` kaydın yapıldığı anki başlangıç değeri + sonraki tüm hareketler.

**Problem:** İmalat tamamlandığında `b2_stok_hareketleri`'ne hareket yazılıyor (İmalat M4 → stok girişi). Ama `stok_adeti` de sıfır değil. İlk yükleme anında `stok_adeti = 100` girilmişse + hareketten de 100 adet geliyorsa net_stok = 200 görünür. Çift sayım riski.

**Doğrusu:** Ya `stok_adeti` başlangıç olarak `net_stok` ile eşitlenmeli ve yalnızca hareketler sayılmalı, ya da `stok_adeti` her zaman 0 başlanmalıydı.

### 2. KATALOG STOKi vs HAREKET STOKi — İKİ AYRI TABLO

Karargah sayfasında (useKarargah.js satır 170-171):
```js
supabase.from('b2_urun_katalogu').select('id', { count: 'exact' })
    .lte('stok_adeti', 10).eq('durum', 'aktif')
```
Stok düşük alarm **Katalog** tablosundaki `stok_adeti` kolonuna bakıyor.

Ama gerçek net stok **Stok** sayfasında =  `stok_adeti + hareketler` hesaplanıyor.

Bu iki değer farklı → Karargah'ta yanlış alarm üretilebilir.

### 3. HAREKET SONRASI `b2_urun_katalogu.stok_adeti` GÜNCELLENMMIYOR

`/api/stok-hareket-ekle` çağrıldığında hareket `b2_stok_hareketleri`'ne yazılıyor. Ama `b2_urun_katalogu.stok_adeti` kolonu güncelleniyor mu? API'nin içeriği incelenmedi. Eğer güncellenmiyor ise Katalog sayfasındaki stok sayısı her zaman başlangıç değerinde kalıyor.

### 4. KASAYLAi BAĞLANTI YOK

Satış yapıldığında (çıkış hareketi) kasaya para girmiyor. Stok çıkışı ≠ kasa girişi. İki sistem bağımsız.

### 5. ÜRÜN KODU DROPDOWN — B2_URUN_KATALOGu'NEi BAĞLI

Hareket formunda ürün seçimi doğrudan `b2_urun_katalogu`'nden geliyor (satır 64). Bu tablo Katalog sayfasıyla aynı kaynak. Katalog'a eklenen ürün Stok'ta görünüyor — doğru entegrasyon.

---

## ❌ EKSİK ENTEGRASYONLAR

| Kaynak | Hedef | Durum | Sorun |
|--------|-------|-------|-------|
| Stok çıkışı → Kasa | YOK | Satış → para girişi yok |
| Stok → Karargah alarm | YANLIŞ TABLO | stok_adeti vs net_stok |
| İmalat devri → Stok otomatik | KISMI | İmalat harekete yazıyor ama çift sayım riski |

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] **Barkod tarama entegrasyonu** → Depodan çıkış barkod okutarak
- [ ] **Otomatik satış-kasa köprüsü** → Stok çıkışı = Kasa girişi
- [ ] **FIFO stok yönetimi** → İlk giren ilk çıkar otomasyonu
- [ ] **Raf yönetimi görsel haritası** → Depo yerleşim planı
- [ ] **Otomatik sipariş tetikleme** → Düşük stokta tedarikçiye otomatik talep
