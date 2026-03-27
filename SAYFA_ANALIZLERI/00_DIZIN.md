# NIZAM ERP — SAYFA ANALİZLERİ DİZİNİ (GÜNCELLENMİŞ)
**Son Güncelleme:** Tüm modüller koddan satır satır doğrulanarak yeniden yazıldı.  
**Çalışma Yöntemi:** Her modülün kaynak kodu okundu, varsayımlar değil, gerçek kod referansları ile sorunlar belirlendi.

---

## 📂 MODÜLi ANALİZ TABLOSU

| Dosya | Modül | Statüs | Kritik Sorun |
|-------|-------|--------|-------------|
| 00_KARARGAH.md | Karargah | ✅ YENİLENDİ | ciro=₺0, ENV kapalı alarmlar, hardcoded hedef |
| 01_ARGE.md | AR-GE | ✅ YENİLENDİ | Scraper merge conflict, zincir kopuk |
| 02_KUMAS.md | Kumaş | ✅ YENİLENDİ | Arama fonksiyonu yok, M1 talep köprüsü |
| 03_KALIP.md | Kalıphane | ✅ YENİLENDİ | ai_satis_karari vs status enum |
| 04_IMALAT.md | İmalat | ✅ YENİLENDİ | Kronometre hardcoded (42dk) |
| 04B_MODELHANE.md | Modelhane | ✅ YENİLENDİ | Bağımsız modül, imalat entegrasyonu yok |
| 05_KESIM.md | Kesimhane | ✅ YENİLENDİ | kullanilan_kumas_mt payload'a dahil değil! |
| 06_KASA.md | Kasa | ✅ YENİLENDİ | Gerçek veri akışı, tablo boş |
| 07_MALIYET.md | Maliyet | ✅ YENİLENDİ | fire_kaybi tipi hiç yazılmıyor |
| 08_MUHASEBE.md | Muhasebe | ✅ YENİLENDİ | kilitlendi status sorunu, kasa köprüsü yok |
| 09_SIPARISLER.md | Siparişler | ✅ YENİLENDİ | Auto üretim emri tetikleme |
| 10_MUSTERILER.md | Müşteriler | ✅ YENİLENDİ | Sipariş FK bağlantısı |
| 11_STOK.md | Stok Depo | ✅ YENİLENDİ | Çift sayım riski, Karargah tutarsızlığı |
| 15_RAPORLAR.md | Raporlar | VAR | Kasa boş → tüm raporlar boş |
| 16_KAMERALAR.md | Kameralar | ✅ YENİLENDİ | GO2RTC tünel yok, localhost fallback |
| 17_AJANLAR.md | Ajanlar | ✅ YENİLENDİ | Konfig localStorage'da, TikTok/IG kod yok |
| 18_GOREVLER.md | Görevler | ✅ YENİLENDİ | modul alanı DB'ye yazılmıyor |
| 19_HABERLESME.md | Haberleşme | ✅ YENİLENDİ | Foto placeholder, gonderen_id=null |
| 20_GUVENLIK.md | Güvenlik | ✅ YENİLENDİ | PIN localStorage, log localStorage, 2FA yok |

---

## 🚨 ACİL EYLEMi GEREKTİREN KRİTİK HATALAR

### SIFIR ÇALIŞAN İŞLEVİ (Kod var, etki yok)
1. **Kumaş Stok Düşümü** — `kullanilan_kumas_mt` KesimMainContainer payload'a dahil değil (`05_KESIM.md`)
2. **Kamera Sistemi** — GO2RTC_URL localhost:1984, Vercel'de çalışmaz (`16_KAMERALAR.md`)
3. **AR-GE Zinciri** — Scraper merge conflict → b1_arge_products boş (`01_ARGE.md`)
4. **Karargah Ciro** — b2_kasa_hareketleri boş → ₺0 gösteriyor (`00_KARARGAH.md`)

### GÜVENLIK RİSKLERİ
5. **PIN localStorage** — DevTools ile görülebilir (`20_GUVENLIK.md`)
6. **Hatalı giriş kilidi** — React state'inde, sayfa yenilenince sıfırlanıyor
7. **Kamera erişimi** — Tüm giriş yapmış kullanıcılar erişebilir (grup kontrolü yok)

### VERİ TUTARSIZLIKLARI
8. **Net stok çift sayım** — stok_adeti + hareketler (başlangıç değeri de bir giriş) (`11_STOK.md`)
9. **Status enum karışıklığı** — production_orders: `completed` vs İmalat: `tamamlandi`
10. **Karargah stok alarmı** — katalogdaki stok_adeti vs gerçek net_stok farklı

---

## 🔗 YENİ TESPİTLER: SİSTEM & AI KOPUKLUK HARİTASI (10 BÜYÜK AÇIK)

1. **Ar-Ge Trendyol / TikTok Ajanları Bağlantısı:** Redis kuyruğu (Workerlar) analiz sonucunu NIZAM Pano'sundaki `b1_arge_trendler` tablosuna (INSERT ile) kaydetmiyor. 
2. **Çöplük Arşivi (Retrospektif Depo) Yazılmamış:** Reddedilen ürünleri 45 gün boyunca takip edip öğrenecek olan o algoritmanız için o çöp (big data) havuzunun tablosu ve aktarım kodu yok.
3. **Zincirci Ajanı İş Fişi Yetkisizliği:** `M3 (Kalıp)` tamamlandığında, `M4'e (Modelhane)` yeni görev satırı eklemiyor. Sadece "Tamamlandı" diye mesaj atıyor (Otonomi kopukluğu).
4. **Sipariş (M9) ve Kasa (M6) Muhasebe Kopukluğu:** Alınan siparişin ödemesi (veya avansı) otomatik olarak `b2_kasa_hareketleri` tablosuna "Gelir" fişi oluşturmuyor. Kasa verisi manuel ilerliyor.
5. **Müşterilerde (M10) Cari Hesap Yokluğu:** M10 modülü sadece telefon defteri gibi yapılmış. Firmanın müşteriden ne kadar Borç veya Alacağı var tutulmuyor.
6. **Raporların (M15) Yanlış Ciro Vermesi:** Raporlar sayfasında veriler veritabanından `limit(200)` kısıtlamasıyla çekildiği için NIZAM, yüksek işlem hacminde geçmiş ciro ve istatistikleri YALANLIYOR.
7. **Personel Maaşları Geriye Dönük Bozma Tehlikesi:** Sistem Ayarlarından "Ücret / Prim" oranı değiştirildiği an, geçmiş aylarda ödenen bordrolar dondurulmadığı için yeni kurdan hesaplanarak finansal tarihi bozuyor.
8. **Kesim Kumaşı Depodan Düşmüyor:** Kesimhane (M5) modülünde "kullanılan_kumaş_mt" girilmesine rağmen, Kumaş (M2) envanterindeki top metrajından bu miktar düşmüyor.
9. **Kamera (Vision AI) Kumaş Fire Uyumsuzluğu:** M4 kamerasının tespit ettiği "DEFOLU" kumaş firesi, tespit edildiği an üretim stoğundan "Çıktı (Fire)" olarak depodan eksilmiyor, sadece uyarı veriyor.
10. **Katalog (M12) İle Stok (M11) Uyumsuzluğu:** Depo stoğu M11'de sıfırlandığı an, M12 Kataloğuna bağlantı çekilmediği için otomatik olarak "Tükendi" ibaresi yansımıyor.

---

## 📊 MODÜL OLGUNLUK DERECESİ

| Kategori | Modüller | Durum |
|----------|----------|-------|
| Üretim Zinciri | Kesim → İmalat → Muhasebe | %60 - Kesimde kritik bug var |
| İstihbarat | AR-GE → Karargah | %20 - Scraper çalışmıyor |
| Gözetim | Kameralar | %15 - GO2RTC tünel yok |
| İletişim | Haberleşme, Görevler | %75 - İyi durumda, küçük eksikler |
| Finans | Kasa, Maliyet, Muhasebe, Stok | %40 - Tablolar büyük ölçüde boş |
| Platform | Güvenlik, Ajanlar | %50 - Güvenlik localStorage bağımlı |

---

## 📁 DOSYA REHBERİ

Her modülün detaylı analizinde şunlar bulunur:
- ✅ **MEVCUT NE VAR** — Satır numarasıyla doğrulanmış
- ❌ **EKSİK BİLGİ AKIŞLARI** — Kod referansıyla açıklanmış
- ❌ **EKSİK ENTEGRASYONLAR** — Tablo
- ❌ **MEVCUT KOD SORUNLARI** — Satır numarasıyla hata
- 📋 **BİLGİ AKIŞI HARİTASI** — ASCII akış şeması
- 🔮 **3-5 YIL SONRA LAZIM OLACAKLAR**
