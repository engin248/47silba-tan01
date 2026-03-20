# THE ORDER / NIZAM - KÖR NOKTA ANALİZİ VE SİSTEM TAHKİMAT RAPORU
**Modül:** M2 / M4 - Modelhane & Talimat Merkezi (`ModelhaneMainContainer.js`)
**Analiz Eksenleri:** Stratejik, Teknik, Operasyonel, Ekonomik, İnsan
**Uygulanan Felsefe:** "Sıfır Hata Toleransı & Maksimum Direnç"

---

## 1. Problem Tanımı
Modelhane modülü, teknik föy fotoğraflarını, dikim talimatlarını ve numuneleri yönettiği gibi "Fason Kilidini" açan kritik bir şalter görevi görmektedir. Ancak alt yapısında hem Supabase'in ağını (Network) kilitleyebilecek, hem depolama sınırlarını (Storage Bloat) patlatabilecek hem de sayfa içi gezinimleri (UX / SPA) baltalayabilecek 3 adet Kör Nokta bulunmaktaydı.

## 2. Temel Varsayımlar
1. Kullanıcıların yüksek hızda birden çok menüye tıklayabileceği, bu esnada arka planda gereksiz sunucu dinlemelerinin kapalı kalması gerektiği varsayılmıştır.
2. Saha elemanının dikim kalıplarını veya numuneleri yüksek çözünürlükte (Örn: 50 MB Raw fotoğraf) sisteme yüklemeye çalışabileceği varsayılmıştır.
3. Modelhane modülünden M3 (İmalat) modülüne geçilirken sayfa yenileme problemi yaşanmaması istenmiştir.

## 3. Kritik Sorular
1. "Sekmeler" (Numuneler, Talimatlar, Galeri) arasında her gezinildiğinde, Supabase WebSocket bağlantısı neden kopup yeniden bağlanarak (Reconnect Spam) gereksiz şekilde kotayı sömürmektedir?
2. Tek bir numuneye limitsiz boyutta onlarca fotoğraf (Örn: 10 adet 15 MB) yüklenmesi Vercel / Supabase faturalarını şişirmez mi?
3. Üretime geç butonuna tıklandığında neden "Link" etiketi yerine klasik "<a>" (Hard-refresh) kullanılmış ve bellekteki tüm geçici veriler sıfırlanmış?

---

## 4. Kör Nokta Analizi (Teşhis ve Zırhlama)

### 🔴 KÖR NOKTA 1: "Realtime WebSocket Closure Kapanı ve Kotanın Tükenmesi" (Teknik ve Ekonomik)
**Tehlike:** React'taki `useEffect` içerisine bağımlılık olarak `sekme` eklendiği için kullanıcı her sekmeye (Galeri, Talimat, Numune vb.) dokunduğunda aktif olan WebSocket kanalını "kapatıp tekrar açıyordu". Bu günde 50 defa tıklayan bir personel için bile "Connection Drop / Reset" problemi ve Supabase Event aşımı (Maliyet/Kota) yaratır. Ayrıca `yukle` fonksiyonu React'ın eski hafıza balonunda kalıyordu (Closure Trap).
**Zırhlama:** `useRef` ile bir Hafıza Referansı (Pointer) yaratılarak WebSocket hook'unun dış dünyadan bağımsız, yalnızca yetkili kullanıcı girdiğinde "Tek Bir Sefer" bağlanması sağlandı. 

### 🔴 KÖR NOKTA 2: "Sonsuz Depolama (Storage Bloat) İsrafı" (Ekonomik ve Risk)
**Tehlike:** İlgili modül `fotografYukle` fonksiyonu içerisinde sadece uzantı kontrolü (`jpg`, `png` vb.) yapmakta ancak **Dosya Boyutu Kontrolü** uygulamamaktaydı. Bu durum sisteme 50 MB'lık dosyaların bile yüklenerek veritabanını kısa sürede patlatmasına sebep olacaktı.
**Zırhlama:** Sisteme `5 * 1024 * 1024` Byte (5 MB) fotoğraf limiti entegre edildi. Üzerindeki dosyalar "Sistem Sağlığı İçin" engellenecek şekilde kırmızı limit bariyeri kuruldu.

### 🔴 KÖR NOKTA 3: "Next.js Bellek Sızıntısı & Kesinti" (İnsan ve Operasyonel)
**Tehlike:** M3 - İmalat Fabrikasına geçiş için konulan rokette (`<a href="/imalat">`) hard link mevcuttu.
**Zırhlama:** Tüm sisteme `NextLink` ithal edilerek (Import), M3 imalathanesine geçişler tamamen SPA (Milisaniyelik Ön Bellek Yönlendirmesi) altına alındı. Navigasyon pürüzsüzleştirildi.

---

## 5. Nihai Sonuç ve Aksiyon
- Orijinal kod üzerine (Modelhane) 3 cerrahi operasyon yapılmıştır.
- Hem depolama, hem veri tabanı bağlantısı hem de navigasyon güvence altındadır. İşlem Vercel/Github seviyesine push edilmeye hazırdır.
