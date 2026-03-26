# GÖREVLER — TAKIM KANBAN BOARD (M18) — Detaylı Sayfa Analizi
**Rota:** `/gorevler` | **Dosya:** `src/features/gorevler/components/GorevlerMainContainer.js`  
**Toplam:** 365 satır  
**Görev:** Ekip görevlerini oluştur, ata, kanban board'da takip et, tamamlandığında Telegram bildir.

---

## ✅ MEVCUT NE VAR (koddan satır satır doğrulandı)

| Bileşen | Durum | Kod Referansı |
|---------|-------|---------------|
| `b1_gorevler` tablosu | VAR | satır 63 |
| 4 Durum sütunlu Kanban Board (bekliyor/devam/tamamlandi/iptal) | VAR | satır 20-25, 314-347 |
| Sürükle-bırak (HTML5 Drag-and-Drop) | VAR | satır 131-150 |
| Optimistik güncelleme (sürükleyince anlık değişim) | VAR | satır 148 |
| Liste görünümü alternatifi | VAR | satır 351-361 |
| Görünüm toggle (Kanban/Liste) | VAR | satır 223-230 |
| Görev CRUD (ekle/düzenle/sil) | VAR | satır 71-128 |
| 4 Öncelik seviyesi (dusuk/normal/yuksek/kritik) | VAR | satır 15-17 |
| Kritik → Telegram bildirimi | VAR | satır 100 |
| Tamamlandı → Telegram bildirimi | VAR | satır 112 |
| Mükerrer görev kontrolü (başlık+bekliyor) | VAR | satır 91-93 |
| Arama (başlık/açıklama/kişi) | VAR | satır 155-159 |
| Öncelik filtresi | VAR | satır 156 |
| Son tarih (datetime-local) | VAR | satır 287 |
| Atanan kişi alanı | VAR | satır 94-95, 283 |
| `sayfaErisim('/gorevler')` yetki kontrolü | VAR | satır 32 |
| `erisim === 'full'` koşulu (salt okunur mod) | VAR | satır 171, 196 |
| Offline guard (çevrimdışı kuyruğa al) | VAR | satır 77-81, 108, 118 |
| Silme → b0_sistem_loglari kara kutu | VAR | satır 123 |
| `silmeYetkiDogrula` güvenlik katmanı | VAR | satır 119 |
| Realtime WebSocket (b1_gorevler) | VAR | satır 46-48 |
| Görev tablo yok hatası yakalama (`42P01`) | VAR | satır 64 |
| İstatistik kartları (gerçek veri) | VAR | satır 161-166 |
| Arapça RTL desteği | VAR | satır 30, 209 |

---

## ❌ EKSİK BİLGİ AKIŞLARI — DETAYLI

### 1. ATANAN KİŞİ — PERSONEL TABLOSUYLA BAĞLANTI YOK

**Sorun (satır 283):**
```js
<input maxLength={100} value={form.atanan_kisi} 
 onChange={e => setForm({...form, atanan_kisi: e.target.value})} 
 placeholder="Ad Soyad..." style={inp} />
```
Atanan kişi **serbest metin** — `b1_personel` tablosundan seçim yok. Aynı kişi "Ahmet", "ahmet YILMAZ", "A. Yılmaz" şeklinde yazılabilir. Personel bazlı görev yükü analizi yapılamaz.

### 2. MODÜL ALANI FORM'DA VAR AMA DB'YE YAZILMIYOR

**Sorun (satır 26):**
```js
const BOSH = { baslik: '', aciklama: '', atanan_kisi: '', son_tarih: '', oncelik: 'normal', modul: 'genel' };
```
`modul` alanı varsayılan formda `'genel'` olarak var ama INSERT query'de (satır 93-97):
```js
const { error } = await supabase.from('b1_gorevler').insert([{
    baslik: ..., aciklama: ..., atanan_kisi: ..., bitis_tarihi: ...,
    oncelik: ..., durum: 'bekliyor'
    // modul: form.modul  ← YAZILMIYOR!
}]);
```
`modul` alanı kaydedilmiyor. Hangi modüle ait görev olduğu bilgisi kaybolmuyor.

### 3. ÜRETIM EMİRLERİYLE BAĞLANTI YOK

**Sorun:** `b1_gorevler` ile `b2_siparisler`, `production_orders`, `b1_imalat_emirleri` arasında hiçbir FK ilişkisi yok. "Sipariş 145 için kalıp hazırlansın" görevi bir sipariş kaydına bağlanamıyor. Takip edilemiyor.

### 4. BİTİŞ TARİHİ GEÇMİŞ GÖREVLER İÇİN UYARI YOK

Görevin `bitis_tarihi` geçmiş olsa bile kart renglenmiyor, uyarı üretilmiyor. "Gecikmiş görevler" filtresi yok.

### 5. GÖREV TAMAMLANMA ONAY MEKANİZMASI YOK

**Sorun (satır 201):**
```js
{g.durum === 'devam' && <button onClick={(e) => { e.stopPropagation(); durumGuncelle(g.id, 'tamamlandi', g.baslik); }}>✅</button>}
```
Tek tıkla tamamlandı olarak işaretleniyor. "Gerçekten tamamlandı mı?" onay mekanizması, fotoğraf/kanıt yükleme veya denetmen teyidi yok.

### 6. `b1_gorevler` TABLOSU ŞEMASI BELİRSİZ

Satır 64: `error.code === '42P01'` (tablo yok hatası) yakalanıyor — bu tablonun Supabase'de var olup olmadığı belirsiz. Tablo yoksa sayfa çalışmıyor ama kullanıcıya sadece toast mesajı gösteriyor.

---

## ❌ EKSİK ENTEGRASYONLAR

| Kaynak | Hedef | Durum | Sorun |
|--------|-------|-------|-------|
| Sipariş → Görev | YOK | Sipariş ID ile görev bağlanamıyor |
| Görev → Personel | YOK | Kişi serbest metin, FK yok |
| Görev → Karargah | YOK | Bekleyen kritik görev sayısı Karargah'ta yok |
| Görev → Bildirim | KISMI | Sadece Telegram (kritik atama + tamamlama) |

---

## 🔮 3-5 YIL SONRA LAZIM OLACAKLAR

- [ ] **Sipariş bağlantısı** → Her görev bir siparişe veya üretime bağlanabilsin
- [ ] **Gecikme alarmı** → Bitis tarihi geçince otomatik Telegram bildirimi
- [ ] **Kanban swimlane** → Personel bazlı yatay şerit görünümü
- [ ] **Gantt chart** → Proje yönetimi görünümü
- [ ] **Bağımlılık yönetimi** → "Bu görev bitince şu başlasın"
- [ ] **Mobil push bildirimi** → Görev atandığında telefona bildirim
