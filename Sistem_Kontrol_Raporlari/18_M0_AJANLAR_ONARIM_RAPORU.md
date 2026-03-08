# 🩺 18_M0_AJANLAR_ONARIM_RAPORU.md

**Belge Tarihi:** 2026-03-08
**Mühendis:** Antigravity AI

M0 - AI Ajan Komuta Merkezi (`src/app/ajanlar/page.js`), botların görev aldığı ana omurga ekranıdır. Hatalı görev bombardımanına (spam) karşı dayanıklılık zırhları giydirildi.

## 🛠️ YAPILAN MÜDAHALELER (DÜZELTİLENLER)

| Kriter | Duruma Tıbbi Müdahale (Yazılımsal Onarım) |
| :--- | :--- |
| **U (Mükerrerlik Çöpü) - [Kırmızı]** | Ajanlara ardı ardına aynı emrin (Örn: "Trendleri Çek") verilmesi hem veritabanını şişirecek hem de API paralarını (OpenAI/Perplexity) yakacaktır. Sistem, **bekleyen** durumdaki görevlerin ismini (`ilike`) arayarak aynı başlıkta çift kayıt açılmasını fiziksel olarak blokeler. *⚠️ Bu görev adıyla bekleyen bir kayıt zaten var!* uyarısı döner. |
| **X (Sınır Stresi & HTML) - [Kırmızı]** | Form alanlarına HTML bazında limitasyonlar getirilmiştir (`maxLength`). Görev adı maksimum 100 karakter, görev emri detayları maksimum 1000 karakterle sınırlandırılarak; veritabanına destan boyutunda `String` gönderilip bellek (RAM) tüketilmesinin önüne geçildi. |
| **R (Güvenlik Kalkanı) - [Kırmızı]** | Sayfa girişi en baştan itibaren Karargâhın bile en üst rutbesi olmayanlara (Tam Yetki & Üretim PIN yetkisi olmayanlara) kapatılmıştır (`useAuth`). Gizliliği korumak için kırmızı uyarı levhası ekranda bekler. |
| **AA (Silme Zırhı) - [Kırmızı]** | Aktif bir arşiv tutulması zorunludur. Ajan loglarının ve görevlerinin kim vurduya gitmemesi adına ajan görevi "sil" eylemi doğrudan sistem içi onay kalkanına (`confirm`) ve "9999" (Admin PIN) kontrolüne bağlanmıştır. |
| **DD (Telegram Pulu) - [Sarı]** | Yeni görev oluşturulduğunda Telegram bildirim botu derhal Karargâh bildirim kanalına hangi ajana hangi emrin verildiğini ileterek yöneticiyi durumdan haberdar eder. |

## ❌ BEKLEMEYE ALINANLAR (İLERİDE MİMARLIK GEREKTİRENLER)

*(Kırmızı risk faktörü yoktur, tamamı gelecek sürüm eklentileridir)*

1. **Zamanlanmış (Cron) Görev Emri:**
   - Ajan komuta merkezinde şu an "Sabah Subayı" gibi sekme/menü gruplamaları (`konfigur` içinde) olsa da, sunucu katmanında gerçek bir saatlik otomatik tetikleyici (Vercel Cron / Supabase pg_cron) yoktur. Bir buton ile veya gün açıldığında manuel çalışırlar. Sistem genişlediğinde otomatiğe alınmalıdır.

---

### 🛑 ANTİGRAVİTY AI NOTU

M0 Ajanlar panelindeki spam ve API israfı yolu (aynı görevin 10 kez tıklanması) kilitlendi. Veri koruması aktif edildi!
