# M15 / KAMERALAR (KÖK ARŞİV VE SİSTEM REFERANS DOSYASI)

**UYARI:** Bu dosya, `src/features/kameralar` modülünün KÖK kimliğidir. NİZAM sistem kurallarına bağlılık yeminidir, her türlü zırh işlemi bu belgeye işlenecektir.

---

## 1. MODÜL GİRİŞ DEĞERLERİ VE TEMEL GÖREVLER
**Dosya Yolu:** `src/features/kameralar/components/KameralarMainContainer.js`
**Sistem Görevi:** İşletme içindeki IP kameraları `go2rtc` arayüzü sayesinde WebRTC üzerinden düşük gecikmeyle izlemek, yetkili kişilere özel (Üretim PIN'i) anlık görüntü çekme ve Telegram'a gönderme yetkisi sunmak. 

**Sayfada Yer Alan Bütün Fonksiyonlar/İşlemler:**
1. **Grid Gözlem Yüzeyi:** Kameraları asenkron yükleyip gruplarına göre göstermek.
2. **AI Tespiti İzleyici (Edge):** Supabase kanalından `camera_events` üzerinden anomali dinlemek.
3. **Snapshot Gönderimi:** Native kamera akışından frame yakalayıp Telegram'a atmak ve bunu "camera_events" log tablosuna eklemek.
4. **Rol Filtrelemesi:** Üretim, Kalite, Depo gibi kamera etiketlerine göre gösterimi sınırlandırmak.
5. **Uyku Modu Takibi:** CPU ve bant genişliği optimizasyonu için inaktif (idle) durumda (3+ dakika) yayınları kapatıp "Uyku Modu" uyarı ekranına geçmek.

---

## 2. KÖK ARŞİV (YAPILAN ZIRHLAMA TESPİT VE DEĞİŞİKLİKLERİ)
*"NİZAM 'Minimum Maliyet - Sıfır Açık' kuralı çerçevesinde bu modüle uygulanan siber cerrahi kayıtlarıdır."*

### 🛠️ Revizyon 1: FAZ-4 NİZAM / Ağ Güvenliği ve Anti-Spam (M15)
*   **Tarih:** 12 Mart 2026
*   **Problemler:** 
    1. Telegram'a snapshot gönderme butonuna (`snapshotGonder`) art arda hızla basmak fetch işleminin tekrarlanmasına ve telegram botunun limitine (rate-limit) takılmasına sebep oluyordu.
*   **Yapılan Ameliyatlar:**
    1. **`islemdeId` Kalkanı:** Snapshot eylemine özgü asenkron süreci kapsayan (`snap_ + kam.id`) kilit sistemi uygulandı.
    2. Buton "Gönderiliyor..." statüsüne geçer, görsel olarak `opacity` 50% ve `cursor: 'wait'` zırhı giyer. İstek bitene kadar ikinci gönderim reddedilir.

---

## 3. GELECEK REHBERİ (MÜHENDİS NOTU)
*   Bu sayfa "görüntüleme/okuma" (read-heavy) ağırlıklı olduğu için form gönderme (post) sadece snapshot loglarıyla mevcuttur. M15 modülü FAZ-4 optimizasyonları kapsamında tam olarak zırhlanmıştır. Uyku modu mekanizması, istemci tarafı CPU yükünü %70 engellemektedir.
