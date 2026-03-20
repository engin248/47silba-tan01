# 🔴 KUSURSUZLUK İÇİN 51 KRİTERLİ SAHA TEST CİHAZI (SIRA TABANLI)

Tarih: 08 Mart 2026
Protokol: "Sıfır Kör Nokta" (Zero Blind Spot) İnovasyon Denetimi

*Bu liste, sistemin hiçbir modülünün es geçilmemesi ve her sekmede İNSAN (Sahada Siz) ile AI'ın (Arka Planda Antigravity) eşzamanlı çarpışarak modülü **tam 51 zırhlı filtreden** geçirmesi için hazırlanmış yegane rotadır. Her sekme "ONAYLANDI" damgası yemeden diğerine geçmek kesinlikle yasaktır.*

---

## 🧭 TEST ROTASI (İŞLEM SIRASI)

> Modülleri verinin akış sırasına (Atölyedeki üretim mantığına) göre test edeceğiz.

* [✅] **M0 - KARARGÂH (Anasayfa & Dashboard) :** (Tamamlandı, Mühürlendi).
* [ ] **M1 - ARGE (Tasarım ve Yenilik Merkezi)**
* [ ] **M2 - MODELHANE / KALIP (Numune & Kesim Şablonları)**
* [ ] **M3 - KUMAŞ ARŞİVİ (Fiziksel Barkodlar & Ham Madde)**
* [ ] **M4 - KESİMHANE (Tabletten QR Okuma & Üretime Giriş)**
* [ ] **M5 - İMALAT GÜNLÜĞÜ (Fason Atölye & Dikiş)**
* [ ] **M6 - STOK VE SEVKİYAT (Ürün Barkodu & İrsaliye)**
* [ ] **M7 - SİPARİŞLER (Satış & Kargo Takip)**
* [ ] **M8 - KASA (Finans & Ön Muhasebe)**
* [ ] **M9 - KALİTE DENETMENİ (AI Vision & Gözlem)**
* [ ] **M10 - PERSONEL (İşçi Puanlama & Liyakat)**
* [ ] **M11 - GÖREVLER (Offline İş Atama)**
* [ ] **M12 - RAPORLAR (Performans Bilanço)**
* [ ] **M13 - AYARLAR VE GÜVENLİK (Admin Kalkanı)**

---

## 🛠️ HER SEKMEYE GİRİLDİĞİNDE "ZORUNLU UYGULANACAK" 51 KRİTERLİ RÖNTGEN

*(Bu kontrol listesini kopyalayıp, teste başladığımız her sekme için yanınızda açık tutun)*

### 🤖 AI (ANTIGRAVITY) TARAFINDAN KOD İÇİNDE ARANACAK 25 KRİTER

*(Ben (AI) bu modülün kodunu saniyeler içinde okuyup şu delikleri arayacağım)*

1. **[F/W/UU] Veritabanı Mimarisi (Supabase):** Veri Türleri doğru mu? (Örn: Paralar Text mi Float mı?). Mükerrer (Double) kayıt atılabilir mi? (Unique key var mı?)
2. **[J/L/S] Next.js Çekirdek Performansı:** `useEffect` içinde sonsuz döngü (Memory Leak) tehlikesi var mı? İhtiyaç dışı re-render (kasma) atıyor mu?
3. **[R/AA/PP] RLS Token & Güvenlik Kapısı:** Kötü niyetli biri "Yetkim Yok" dediği halde tarayıcı konsolundan (F12) sahte pin girip bu modülü hackleyebilir mi?
4. **[O/Y/K] Sürdürülebilirlik & Sınırlar:** İnternetten çekerken `.limit(100)` var mı? 5 sene sonra 2 milyon veri olunca bu sayfa açılırken çöküp beyaz ekranda kalır mı?
5. **[Q/X/U] Ölüm Testi (Error Boundary):** Kaydet butonuna saniyede 10 kere hızlıca basılırsa ne oluyor? İşlem kilitleniyor mu (Race Condition)? Veri gelmezse Try-Catch kırmızı uyarı atıyor mu?
6. **[FF] Veri Tazeliği (Realtime):** Diğer bilgisayardan kayıt girildiğinde ekrana "Sayfayı Yenilemeden" düşüyor mu? WebSocket (Channel) aktif mi?
7. **[GG] Para ve Matematik:** Kesirlerde (Kuruş) aşağı yuvarlama veya sızıntı hatası var mı? (Örn: 22.99 yerine 23 görünüyor mu?)
8. **[NN/HH/MM] Sıfır Hatası & Çöp Temizliği:** Kullanıcı Adet girmeden "Boş" bırakırsa veya sistemde Null/Undefined gelirse patlıyor mu? Sayfa içinde kullanılmayan (Ölü) kod yığını var mı?
9. **[İnternetsiz] IndexedDB Kuyruğu:** Sayfada Offline (İnternet Yokken) kayıt girilirse `idb` kuyruğuna veri hapsoluyor mu?
10. *(... AI geri kalan 16 alt mimari kriteri tek bir Regex/Performans taramasıyla otomatik onarır).*

### 👁️ İNSAN (SİZİN) TARAFINIZDAN CİHAZDA DENENECEK 26 KRİTER

*(Siz bu modülü tabletten/bilgisayardan açıp fiilen şunlara saldıracaksınız)*

1. **[A/B/C] İhtiyaç ve Yorgunluk Matrisi:** Bu sayfadaki bir işlemi yapmak için kaç kere tıklıyorum? İşçi bunu kullanırken küfür eder mi? Tıklama C eziyet mi? Lüzumsuz bir özellik (Fazlalık) veya çok çok eksik bir kolon (İhtiyaç B) var mı?
2. **[E/G/T] Arayüz, Tipografi ve Sezgisellik:** Tablolar telefonda veya tablette yamuluyor mu? Yazılar küçük veya soluk mu? Butonun ne işe yaradığı (Sezgisellik T) bir çaycı veya çırak tarafından bile anında anlaşılır derecede (Aptal-Geçirmez) belirgin mi?
3. **[H/I] Dil ve Soru Mantığı:** Ekranda yazan Türkçe kelimeler (Label'lar) sektörün anlayacağı dilden mi? (Örn: "Processed" yerine "Kesime Çıktı" yazıyor mu?)
4. **[WW] KVKK Gizlilik Testi:** Arkanızdan geçen bir atölye işçisi; o sayfada patronun cirosunu, paraları veya görmemesi gereken bir maliyet fiyatını görebilir mi? Sansür (EyeOff) butonu var mı?
5. **[XX] Fiziksel Saha Gerçekliği:** Ekranda "14 Top Kumaş" diyor ama depoda gerçekten o kumaş barkodunu o sayfa okuyabiliyor mu? Barkod okuyucu (Kamera) takılmadan çalışıyor mu?
6. **[YY] İşçi Direnci (Kabulü):** İşçinin klavye kullanması zorunlu mu yoksa Mikrofon (Ajan) veya büyük dokunmatik yüzeyler ile direnişi (Üşengeçliği) kırılmış mı?
7. **[DD/RR] Psikolojik Uyarı & Renk Tutarlılığı:** Hata yaptığımda (Yanlış değer girdiğimde) çıkan uyarı mesajı kırmızı renkli, tatmin edici ve "Nasıl düzelteceğimi" söyleyecek şefkatte mi? Yoksa sadece "Error" diyip bırakıyor mu? (Görsel tutarlılık RR).
8. **[II] Geri Dönülmezlik Testi:** Yanlışlıkla bir şeyi silersem, sistem benden "Emin misin, Yönetici Pini gir" diye çift onay istiyor mu?
9. *(... İnsan geri kalan 8 ticari ve görsel kriteri göz ucuyla saniyeler içinde karar verip not eder).*

---

## 🎯 SONUÇ (NASIL ÇALIŞACAĞIZ?)

> "Komutanım, M1 ARGE sayfasındayız. Sahnede siz varsınız."
>
> Ben (Antigravity): *"API'yi taradım, 100 limit var çok iyi. Güvenlik ve RLS zırhını otonom kapattım. Para hesaplaması sağlam. Benim 25'im [ONAYLI]. Sahanın (Sizin) 26'lı Test Durumu Nedir?"*
>
> Siz (Komutan): *"Yazılar çok küçük, mobilde buton sola kaymış. KVKK için fiyatı gizlememişsin. Kumaş eklerken 'Sezon' kolonu yok."*
>
> Ben (Antigravity): *"Hemen o kör noktaları odaya taşıyıp ameliyat ediyorum."*
>
> *(...Ameliyat Biter, [ONAYLANDI] damgası yenir, sıradaki M2 modülüne geçilir).*
