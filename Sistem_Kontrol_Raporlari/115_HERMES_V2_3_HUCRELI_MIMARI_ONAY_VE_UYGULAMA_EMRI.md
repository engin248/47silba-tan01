# 115_HERMES_V2_3_HUCRELI_MIMARI_ONAY_VE_UYGULAMA_EMRI

**Tarih/Saat:** 12 Mart 2026
**Konu:** 7 Ajanlı Hayalperest Mimarinin İptali ve "V2.0 - 3 Hücreli Gerçekçi İmalat ve Kuyruk (Queue) Mimarisi"nin Yürürlüğe Girmesi
**Durum:** KABUL EDİLDİ - İNŞA BAŞLIYOR

Komutanın vizyonu ve dış denetmenlerin acımasız saha gerçeklikleri (%100 pamuk ölçememe, Amazon fake satışları, DB kilitlenmesi) doğrultusunda, eski plan imha edilmiş ve yerine **Askeri Sınıf Karar Destek Zırhı V2.0** geçirilmiştir.

## 🛡️ YENİ MİMARİ: 3 HÜCRELİ GÜVENLİ YAPILANMA

### 1- HÜCRE 1: VERİ TOPLAMA VE ALARM (Eski Avcı ve Gözlemci)
*   **Görevi:** Sadece "Çok Satıyor" etiketine kanmaz. Amazon/Zara fiyatını, Google Trends Hacmi ve Review Velocity (Yorum Artış İvmesi) ile **çarpraz doğrular**.
*   **Kural:** Fiyat stabilitesi ve pazar ivmesi eşleşmiyorsa, ürün "Şişirilmiş (Fake)" sayılarak reddedilir.

### 2- HÜCRE 2: ANALİZ VE ÖN-SENTEZ (Kumaş Felaketi Sigortası)
*   **Görevi:** AI kesinlikle "Bu %100 Ketendir" diye halüsinasyon görmez. Sadece **İçgörü (Insight)** sunar: *"Görünüm: Keten Benzeri, Risk: Yüksek"*.
*   **İnsan Zırhı (Checkpoint):** Ar-Ge'den çıkan bu İlham Kartı, Modelhanede (M2) fiziki kumaşa dokunan bir **Satın Almacı veya Baş Modelist tarafından manuel olarak onaylanmadan** üretime ve net maliyet hesabına geçemez.

### 3- HÜCRE 3: KAYIT VE VERSİYONLAMA (Eski Zırh ve Tasnifçi)
*   **Görevi (Queue/Kuyruk):** Supabase'i patlatacak olan "7 ajanın aynı anda veri yazması" engellenmiştir. İşlemler Message Broker (Sıraya Sokucu) mantığıyla 10'lu Batch'ler halinde asenkron yazılır.
*   **Versiyonlama:** Veri dondurulmaz. Revizyon geldikçe `trend_v1`, `trend_v2` olarak ilişkisel tablolara kaydedilir (Deadlock engellenir).
*   **Zamansal Doğrulama (Gece Bekçisi):** Sayfa kapandıysa doğrudan "Satmadı" denmez; son 48 saatteki reyting ivmesine bakılarak "Yok Sattı (Sold Out Success)" lojistiği işletilir.

---

## ⚙️ KODLARA LEHİMLENECEK İLK OPERASYON ADIMLARI
Bu onaylı taslağı fiiliyata geçirmek için aşağıdaki 3 ameliyat derhal başlayacaktır:

1.  **GAMA TİMİ (Veritabanı):** Eski 7 tabloluk dondurulmuş (frozen) mantık silinip; `event_log`, `model_master` ve `analysis_result` adında 3 Ana Normalize ve Versiyonlanabilir tablo yazılacaktır.
2.  **BETA TİMİ (API & Kuyruk):** `trend-ara/route.js` içindeki 15 saniyelik saatli bomba sökülecek; arama işlemleri "Queue (Kuyruk)" mantığına geçirilip timeout süresi uzatılacaktır. Prompt, "kesin kumaş" yerine "İlham Kartı (Insight)" sunmaya ayarlanacaktır.
3.  **ALFA TİMİ (Frontend):** `ArgeMainContainer.js` içindeki onay mekanizması, insan (Satınalma/Modelist) onayına sunulacak şekilde "Durum Makinesi (State Machine)" altyapısına bağlanacak ve URL üzerinden (/modelhane?trend_id=X) güvenli veri devrimi yapılacaktır.

**ONAYLANMIŞTIR. İNŞAAT PROTOKOLÜ HAZIR.**
