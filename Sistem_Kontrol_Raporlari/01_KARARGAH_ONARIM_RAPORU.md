# 🏥 KARARGÂH (M0) — AMELİYAT VE ONARIM RAPORU

**Dosya:** `src/app/page.js`
**Onarım Tarihi:** 2026-03-07
**Mühendis:** Antigravity AI

Bu rapor, Karargâh (Anasayfa) modülünde tespit edilen tehlikeli hataların nasıl çözüldüğünü ve ileride tekrar aynı hata yaşanırsa nereye bakılması gerektiğini dokümante etmek için hazırlanmıştır.

---

### 1️⃣ [KRİTİK HATA] Sunucu Faturanızı Şişiren `setInterval` Döngüsü

* **Sorunun Kaynağı:** Sayfa, veritabanına her 30 saniyede bir `setInterval` kod bloğu ile soruyordu ("Yeni alarm var mı?"). Tablet sabah açık unutulduğunda gece sabaha kadar patronun API kotasını (faturasını) boş yere tüketiyordu.
* **Kullanılan Teknoloji:** Supabase Realtime (WebSocket)
* **Nasıl Çözüldü:** Kod bloğundaki ilkel `setInterval` tamamen silindi. Yerine Supabase'in anlık `channel('karargah-gercek-zamanli')` websocket portu bağlandı. Artık sistem sadece **yeni bir görev veya değişim olduğunda** tepki verecek (Push Notification mantığı). Sunucu faturası şişmeyecek.
* **Gelecekte Çökerse Nereye Bakılmalı:** `supabase.channel()` bloğuna bakın. Supabase Dashboard üzerinden "Realtime" açık mı teyit edin.

### 2️⃣ [KRİTİK HATA] Aynı Anda 10 Görev Girme (Spam / Flood) Riski

* **Sorunun Kaynağı:** "Hızlı Görev Ekle" butonunda hiçbir tıklama engeli (Throttle/Debounce) yoktu. Biri Enter tuşuna basılı tuttuğunda saniyede 20 defa aynı postayı veritabanına işleyebilirdi.
* **Kullanılan Teknoloji:** React State (`islemYapiliyor`) & Guard Pattern
* **Nasıl Çözüldü:** `islemYapiliyor` adında bir bariyer kilit (Rate Limit State) kuruldu. İşlem başlarken Input ve Buton "disabled" (pasif) duruma geçiyor, veritabanı "Kaydedildi" yanıtı verdikten sonra kilit açılıyor. Ayrıca Supabase `select().eq('baslik')` ile anlık Mükerrer Kontrolü güçlendirildi.
* **Gelecekte Çökerse Nereye Bakılmalı:** `hizliGorevEkle` fonksiyonu içindeki `setIslemYapiliyor` state dönüşlerine bakın.

### 3️⃣ [SİSTEMSEL RİSK] `Promise.all` ile Beyaz Ekran Çökmesi

* **Sorunun Kaynağı:** Dashboard ekranı Alarmları yüklerken "Görevleri, Stoğu ve Kasayı" tek bir ağ paketinde (`Promise.all`) çekiyordu. Bunlardan sadece bir tanesinde (örneğin stok tablosunda) anlık kopma olsaydı, diğerleri de ekrana gelmiyor ve "Beyaz Ekran" (Fatal Error) fırlatıyordu.
* **Kullanılan Teknoloji:** ECMAScript `Promise.allSettled`
* **Nasıl Çözüldü:** Kod `Promise.allSettled` olarak güncellendi. Artık Kasa tablosu kopsa (Rejected) bile, Görevler ekranda kusursuz görünmeye devam edecek (Fulfilled).
* **Gelecekte Çökerse Nereye Bakılmalı:** `alarmYukle` metodundaki `Promise.allSettled` dizi indeksleme (`gorevRes.status === 'fulfilled'`) mantığına bakın.

### 4️⃣ [UX/İNSAN HATASI] Görevi Yanlışlıkla Ekleyip Silememek

* **Sorunun Kaynağı:** Hızlı görev eklendikten sonra silme özelliği yazılmamıştı. Personel yanlışlıkla bir görev eklerse "Admin bunu veritabanından silsin" diye beklemek zorunda kalıyordu.
* **Kullanılan Teknoloji:** React Event Propagation & Supabase Delete
* **Nasıl Çözüldü:** Bekleyen Görevler listesindeki her görevin sağına Kırmızı Çöp Kutusu (🗑️ Trash2 Icon) eklendi. Basıldığında "Emin misin?" sorusunu yöneltip Supabase `.delete().eq('id', id)` tetikleyecek kod mimarisi kuruldu.
* **Gelecekte Çökerse Nereye Bakılmalı:** `hizliGorevSil(id, e)` fonksiyonunu ve `.delete()` sorgusunu kontrol edin.

### 5️⃣ [GÜVENLİK İHLALİ] Gevşek Supabase API Şifresi Kullanımı

* **Sorunun Kaynağı:** Güvenli olarak yapılandırılmış `lib/supabase` varken, sayfa kendi içinde sürekli `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` koduyla lokal kopya kütüphane çekiyordu. Yetkisiz girişlerde zırha takılması gereken bazı veriler sızabilirdi.
* **Kullanılan Teknoloji:** Global Singleton Bağlantı (`lib/supabase`) & RLS Erken Kalkanı
* **Nasıl Çözüldü:** Gereksiz `await import` komutları silindi ve standart `import { supabase } from '@/lib/supabase'` kullanıldı. Giriş bloğuna (useEffect) `if (!kullanici && !genelPin)` devriyesi atıldı; eğer kullanıcı tespit edilmezse işlem anında sonlandırılıyor (`return`) ve alttaki hassas kodlar asla çalıştırılmıyor.
* **Gelecekte Çökerse Nereye Bakılmalı:** `useEffect` giriş kalkanına ve RLS (Row Level Security) kurallarınıza bakın.

---
✅ **Karargâh Orijinal Dosyası (page.js) Üzerinde Değişiklikler Tamamlandı ve Kod Mühürlendi.** M2'ye (İmalat Modülü) Geçişe Hazırdır.
