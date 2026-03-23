# THE ORDER / NIZAM - SİSTEM İŞLEM LOGU

## İŞLEM: FAZ-1 KAMERA (NVR) ALTYAPISININ CANLI OPERASYONA (PRODUCTION) ALINMASI
**Tarih:** 11 Mart 2026
**Onaylayan Makam:** Engin (Sistem Kurucusu)
**Modül:** M0 - Karargâh Vizyon Paneli

---

### 1. ALINAN GEÇİŞ ONAY EMRİ VE REVİZYONLAR
- **Stres Testi Revizyonu:** Önceden planlanan "48 saatlik kesintisiz uptime" kuralı, işletme menfaatleri ve gerçek operasyonel mesai saatleri göz önüne alınarak iptal edilmiştir.
- **Geçerli Çalışma Düzeni:** İşletme mesai sabah 08:00 - akşam 19:00 (Yoğunluk durumunda maksimum gece 24:00) olarak belirlenmiştir.
- **Durum:** NVR donanımının stres testlerinden başarıyla geçtiği, IP kilitlenmesi yaşanmadığı ve görüntülerin stabil kaldığı kesinleşmiştir.
- **Emir:** FAZ-1 Kamera izleme altyapısı başarıyla tamamlanmış olup Karargâh'ın canlı (Production) ortamına alınma emri işleme konmuştur.

### 2. SİSTEM LOGLAMA VE ANINDA TESPİT ZIRHI (YENİ KARAR)
Kurucu tarafından "kapanma tespitinin anında loga dönmesi" emredilmiştir. Buna istinaden şu kural sisteme entegre edilmiştir:
- Tespitler tarayıcı (Frontend / Iframe onError) bağımlı kalamaz. Sayfaya kimse bakmıyor olsa dahi kapanma anında log (Error Tracking) oluşturulacaktır.
- **Mesai Zamanı Filtresi:** Log kayıtlarında, mesai dışı (Gece 00:00 ile 08:00 arası) yaşanacak kesintiler "Gri (Offline/Planlı Kapanış)" statüsünde kaydedilecek olup kritik hata (Kırmızı/Alarm) sayılmayacaktır, böylece sürdürülebilirlik zarar görmeyecektir.

### 3. SON DURUM DEĞERLENDİRMESİ
- Altyapı (`go2rtc`, yerel RTSP, VPN/Port yönlendirmesi) testleri: **BAŞARILI**
- Arayüz (`KameralarMainContainer.js`, Hata yönetimi): **BAŞARILI**
- Üstyapı Operasyonu (Canlı Ekran, Hızlı Loglama, Snapshot Aktarımı): **AKTİF VE CANLI**

> *Bu log kaydı "Tespitin anında loga dönmesi gerekir" emrine istinaden Karargâh Kara Kutusu'na fiziksel bir kanıt oluşturmak üzere bırakılmıştır.*
