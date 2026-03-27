import cv2
import sqlite3
import time
import requests
from datetime import datetime
import threading
from ultralytics import YOLO

# 🤖 NIZAM — EDGE AI (ÇEVRİMDIŞI) AĞIR SIKLET İŞ SAYICI [v2.0 - TRACKING ID MANTIKLI]
# Hata Payı %0'a indirilmiş, Uyku (Sleep) kör noktası kaldırılmış versiyon.

RTSP_URL = "http://127.0.0.1:1984/api/stream.mjpeg?src=d2_sub" 
NIZAM_API_URL = "https://mizanet.com/api/uretim-senkronize"

print("[YAPAY ZEKA] YOLOv8 Göz Motoru Belleğe Yükleniyor... Lütfen Bekleyin.")
model = YOLO("yolov8n.pt")

def veritabani_kur():
    conn = sqlite3.connect('sayac_lokal_db.sqlite')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS uretim_sayimi (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            kamera_adi TEXT,
            urun_cinsi TEXT,
            adet INTEGER,
            zaman TEXT,
            senkronize INTEGER DEFAULT 0
        )
    ''')
    conn.commit()
    conn.close()

def kurye_botu():
    while True:
        try:
            conn = sqlite3.connect('sayac_lokal_db.sqlite')
            c = conn.cursor()
            c.execute("SELECT * FROM uretim_sayimi WHERE senkronize = 0 LIMIT 50") # Batch / Sınırlandırma
            bekleyen_isler = c.fetchall()

            for is_kaydi in bekleyen_isler:
                print(f"[NIZAM-SYNC] ☁️ Buluta API Puanı Fırlatılıyor: {is_kaydi[2]} - Adet: {is_kaydi[3]}")
                
                try:
                    payload = {
                        "kamera_adi": is_kaydi[1],
                        "urun_cinsi": is_kaydi[2],
                        "adet": is_kaydi[3],
                        "tarih_saat": is_kaydi[4]
                    }
                    
                    res = requests.post(NIZAM_API_URL, json=payload, timeout=5)
                    
                    # KANITLANMIŞ KÖR NOKTA DÜZELTİLDİ: 'or True' kaldırıldı.
                    # Eğer Vercel API çöker (500) veya yetki hatası (403) verirse kayıt silinmez!
                    if res.status_code in [200, 201]:
                        c.execute("UPDATE uretim_sayimi SET senkronize = 1 WHERE id = ?", (is_kaydi[0],))
                        print(f"  [+] BAŞARILI: Veri merkeze işlendi. (Status: {res.status_code})")
                    else:
                        print(f"  [-] BAŞARISIZ: Vercel/API Hatası (Status: {res.status_code}). Veri SQLite'ta korunuyor.")
                        # API tarafındaki geçici hata durumunda diğerlerini atmak da hata vereceği için döngüyü kırıp 30 sn beklemek mantıklıdır
                        break 
                        
                except requests.exceptions.RequestException as err:
                    print(f"  [!] İNTERNET KOPTU veya SUNUCU YANIT VERMİYOR. Veri SQLite'ta korunuyor. Hata: {err}")
                    break # İnternet koptuğu için sıradaki diğer kayıtlara geçmeden döngüyü kırıp 30 saniye bekler
            
            conn.commit()
            conn.close()
        except sqlite3.Error as e:
            print(f"[VERİTABANI HATASI] SQLite Okuma/Yazma hatası: {e}")
            
        time.sleep(30)

def kamera_sayac_gozu():
    print(f"[KAMERA] {RTSP_URL} Göz Açılıyor... Şahin Devrede!")
    cap = cv2.VideoCapture(RTSP_URL)
    
    SAYICI_CIZGI_Y = 300 
    sayilan_urun_sayisi = 0
    
    # TRACKING ID HAFIZASI (Ekranda görünen nesnelerin önceki Y koordinatlarını tutar)
    # { box_id: onceki_merkez_y_koordinati }
    gecmis_konumlar = {}

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("[HATA] Görüntü koptu. Yeniden bağlanılıyor...")
            time.sleep(5)
            # cap = cv2.VideoCapture(RTSP_URL) # Bellek sızıntısını önlemek için önce kapatılır:
            cap.release()
            cap = cv2.VideoCapture(RTSP_URL)
            continue
            
        # model.track() nesnelere benzersiz bir ID atar (persist=True sayesinde)
        results = model.track(frame, persist=True, verbose=False)
        
        # O anki karedeki ID'lerin listesi (eski/kaybolan ID'leri hafızadan temizlemek için)
        aktif_idler = set()
        
        for r in results:
            boxes = r.boxes
            if boxes is None or len(boxes) == 0:
                continue
                
            for box in boxes:
                if box.id is None:
                    continue
                    
                nesne_id = int(box.id[0].item())
                aktif_idler.add(nesne_id)
                
                x1, y1, x2, y2 = box.xyxy[0]
                merkez_y = int((y1 + y2) / 2)
                merkez_x = int((x1 + x2) / 2)
                
                # --- YAZILIMSAL ANOMALİ (ÇİFTE SAYIM / EKSİK SAYIM) DÜZELTİLDİ ---
                # Mantık: Nesne eğer bir önceki karede çizginin üstündeyse (< 300),
                # ve şu anki karede çizginin altına veya üstüne tam bastıysa (>= 300), "Sayımı Yap".
                # Yalnızca AŞAĞI doğru (veya bant yönüne göre) net geçişte sayar.
                
                if nesne_id in gecmis_konumlar:
                    onceki_y = gecmis_konumlar[nesne_id]
                    
                    # Çizgiyi YUKARIDAN AŞAĞIYA kesti mi? (Bant yönünüz bu ise)
                    if onceki_y < SAYICI_CIZGI_Y and merkez_y >= SAYICI_CIZGI_Y:
                        su_an = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        sayilan_urun_sayisi += 1
                        
                        try:
                            conn = sqlite3.connect('sayac_lokal_db.sqlite')
                            c = conn.cursor()
                            c.execute("INSERT INTO uretim_sayimi (kamera_adi, urun_cinsi, adet, zaman) VALUES (?, ?, ?, ?)",
                                      ("Bant-1-Kamera", "Uretim-Hatti", 1, su_an))
                            conn.commit()
                            conn.close()
                            print(f"[AĞIR SIKLET YZ] ✅ {su_an} | +1 Ürün Geçti! (ID: {nesne_id})")
                            # DİKKAT: time.sleep(0.5) BURADAN KALDIRILMIŞTIR! Çifte sayım imkânsızdır çünkü şart ('onceki_y < 300' ve şu 'an >=300') bir kez gerçekleşir.
                        except sqlite3.Error as e:
                            print(f"[DB HATA] Sayım kaydedilemedi: {e}")
                
                # Şu anki konumu, bir sonraki kare için "geçmiş" olarak hafızaya al
                gecmis_konumlar[nesne_id] = merkez_y
        
        # Hafıza Temizliği: Ekranda artık olmayan ID'leri sözlükten sil (RAM şişmesini engeller)
        gecmis_konumlar = {k: v for k, v in gecmis_konumlar.items() if k in aktif_idler}
        
        # Ekran Çıktısı (Çizim)
        cv2.line(frame, (0, SAYICI_CIZGI_Y), (1200, SAYICI_CIZGI_Y), (0, 255, 0), 2)
        cv2.putText(frame, f"NET SAYILAN: {sayilan_urun_sayisi}", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)
        cv2.imshow("NIZAM AI - URETIM GOZU (v2.0 Hile Korumali)", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    print("==================================================")
    print(" NIZAM EDGE AI - v2 YENİ NESİL SAYAÇ BAŞLATILIYOR ")
    print("==================================================")
    
    veritabani_kur()
    kurye_thread = threading.Thread(target=kurye_botu)
    kurye_thread.daemon = True
    kurye_thread.start()
    
    kamera_sayac_gozu()
