# 🕵️‍♂️ KARARGÂH (ANASAYFA) - İNSAN & İŞLETME ODAKLI 11 KRİTER TEST RAPORU

**Dosya:** `src/app/page.js`
**Test Ekibi:** Antigravity AI (UX ve İşletme Simülasyonu)
**Tarih:** 2026-03-07
**Durum:** Hatalar tespit edildi. Raporlandıktan sonra düzeltme (Ameliyat) onayı beklenecek.

---

### 🧠 11 KRİTER İNCELEME SONUÇLARI

| Kod | Kriter Adı | Antigravity'nin Gözlemi ve Analizi | Durum Onayı |
| :---: | :--- | :--- | :---: |
| **A** | **Gereklilik Pulu** | İşletmenin kalbi (Dashboard) olduğu için kullanımı kesinlikle zorunlu ve en faydalı sayfa. Tasarım amacı %100 yerinde. | 🟢 Uygun |
| **B** | **İhtiyaç Matrisi (Eksik/Fazla)** | Ekranda sol tarafta bulunan **"İzole Birimlere Giriş (Tolerans Sınırı)"**butonları çok sönük ve renksiz kalmış. Ustaların veya patronun hızlı geçiş yapması için bu 3 butonun devasa ikonlu ve dikkat çekici olması gerekir. | 🔴 Uygun Değil |
| **D** | **Ticari Kar / Fayda** | Ciro, Maliyet ve en önemlisi **Zayiat (Fire)** oranını anında yüzdelik olarak (Örn: %3.4) patronun gözüne sokması ticari karı direkt artırır. Hata azaltır. | 🟢 Uygun |
| **E** | **Sunulan Bilgi Formatı** | Parasal verilerin altındaki ilerleme çubukları (Progress Barlar) durumu tek bakışta özetliyor. Gözü harf okumayla yormuyor. | 🟢 Uygun |
| **M** | **Sunucu/Yapı Maliyeti** | Supabase `.channel` (Websocket) yapısına geçildiği ve datalar `.limit(5)` ile ufaltılarak çekildiği için Vercel veya Supabase sunucusuna ticari fatura yükü sıfıra yakındır. | 🟢 Uygun |
| **Y** | **Fiziksel Kapasite (Wi-Fi)** | Sistemde anlık video veya büyük resimler dönmediği için, atölyenin dandik bir modemi bile 50 tableti Karargahta aynı anda kaldırır. | 🟢 Uygun |
| **WW**| **Hukuk ve KVKK Kalkanı** | **[ÇOK RİSKLİ]** Ekranda dev puntolarla "Toplam Ciro: ₺400.000" ve "Personel Gideri: ₺80.000" yazıyor. Tablet açıkken yoldan geçen bir işçi veya misafir şirketin tüm kasasını saniyesinde görür. Bu rakamların başlangıçta **sansürlü/bulanık (***) gösterilmesi** ve sadece patronun Göz ikonuna tıklayarak açması şarttır. | 🔴 Uygun Değil |
| **XX**| **Saha Gerçekliği (Depo)** | Alarm listesinde "Kritik Stok (Örn: Kırmızı İplik)" uyarısı çok güzel. Ancak uyarı bir yazıdan ibaret; tıklayıp direkt stok ekranına ışınlanma (Link geçişi) yok. Hızlı müdahale edilemez. | 🔴 Uygun Değil |
| **YY**| **İşçi Psikolojisi (Direnç)** | "Ajanı Çağır (Mikrofon)" butonu tam bir ihtilal niteliğinde. Klavyede yazı yazmaktan, defterde karalamaktan nefret eden ustalara sadece "Kumaş Bitti" diyerek görev yazdırmak sistemi %100 benimsetir. | 🟢 Uygun |
| **G1**| **UX-Arayüz Okunabilirliği**| Beyaz (#ffffff) arka plan üzerine zıt renkler (Zümrüt Yeşili, Lacivert) ve büyük fontlar kullanıldığı için kirli ortamda dahi okunabilirlik yüksek. | 🟢 Uygun |
| **V1**| **Rakip ERP Durumu** | SAP veya Nebim gibi hiçbir klasik ERP'de ana ekranda Yapay Zeka Sesli Görev oluşturucusu veya %100 Canlı Akış alarmı bu kadar pürüzsüz çalışmaz. Çok önde. | 🟢 Uygun |

---

### ⚠️ DÜZELTİLECEK HATALAR LİSTESİ (AMELİYAT PLANI)

Koordinatör onay verdiği takdirde **Karargâh (M0)** sayfası için şu kodsal düzeltmeleri yapacağım:

1. **KVKK Finansal Örtbas (WW Kriteri):** Ciro, Maliyet, Prims ve Fire tutarlarının rakamsal görünümünü kapalı/sansürlü hale getirecek bir "Göz / Sansür" (Eye/EyeOff) butonu ekleyeceğim. (React useState ile).
2. **Alarm Link Köprüleri (XX Kriteri):** Alarmlar kutusundaki Kritik Stok satırlarını, tıklanınca direkt Katalog/Stok sayfasına ışınlayacak şekilde değiştireceğim.
3. **Navigasyon İyileştirme (B Kriteri):** İmalat, Üretim ve Denetmen sayfalarına giden menü butonlarını, devasa logolarla ve arka plan renkleriyle boyayacağım.

*Otonom Düzeltme İşlemi için Emir Bekleniyor.*
