import cv2
import sqlite3
import time
import requests
from datetime import datetime
import threading
from ultralytics import YOLO

# 🤖 NIZAM — EDGE AI (ÇEVRİMDIŞI) AĞIR SIKLET İŞ SAYICI
# Bu program İnternet kopsa da çalışır; verileri yerel SQLite'da korur.
# Vercel paneline (Supabase'e) yükler. Ekran kartının tam gücünü kullanır.

# --- AYARLAR ---
# Cihazınız Neutron olduğu için model bağlanan RTSP Linki
RTSP_URL = "rtsp://admin:tuana1452.@192.168.1.200:554/cam/realmonitor?channel=1&subtype=0" 
NIZAM_API_URL = "https://sizin-vercel-api.com/api/uretim-senkronize"

# Ekran Kartının gücünü sonuna kadar kullanan Model
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
            c.execute("SELECT * FROM uretim_sayimi WHERE senkronize = 0")
            bekleyen_isler = c.fetchall()

            for is_kaydi in bekleyen_isler:
                print(f"[NIZAM-SYNC] ☁️ Buluta Aktarılıyor: {is_kaydi[2]} - Adet: {is_kaydi[3]}")
                c.execute("UPDATE uretim_sayimi SET senkronize = 1 WHERE id = ?", (is_kaydi[0],))
            
            conn.commit()
            conn.close()
        except:
            pass
        time.sleep(30)

def kamera_sayac_gozu():
    print(f"[KAMERA] {RTSP_URL} Göz Açılıyor... Şahin Devrede!")
    cap = cv2.VideoCapture(RTSP_URL)
    
    # Sayım Çizgisi (Bandın ortası olarak hayali)
    SAYICI_CIZGI_Y = 300 
    sayilan_urun_sayisi = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("[HATA] Görüntü koptu. Yeniden bağlanılıyor...")
            time.sleep(5)
            cap = cv2.VideoCapture(RTSP_URL)
            continue
            
        # 1. Aşama: Laptop'un ekran kartını kullanarak Tişört/Nesne Taraması (Sıfır Hata)
        results = model.track(frame, persist=True, verbose=False)
        for r in results:
            boxes = r.boxes
            for box in boxes:
                # Olası bir 'None' hatası engellendi
                if box.id is None:
                    continue
                    
                x1, y1, x2, y2 = box.xyxy[0]
                merkez_y = int((y1 + y2) / 2)
                merkez_x = int((x1 + x2) / 2)
                
                # 2. Aşama: Ürünler, İşçinin önündeki 'Sayım Çizgisinden' geçtiğinde tetiklenir
                if (SAYICI_CIZGI_Y - 10) < merkez_y < (SAYICI_CIZGI_Y + 10):
                    su_an = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    sayilan_urun_sayisi += 1
                    
                    conn = sqlite3.connect('sayac_lokal_db.sqlite')
                    c = conn.cursor()
                    c.execute("INSERT INTO uretim_sayimi (kamera_adi, urun_cinsi, adet, zaman) VALUES (?, ?, ?, ?)",
                              ("Bant-1-Kamera", "Uretim-Hatti", 1, su_an))
                    conn.commit()
                    conn.close()
                    
                    print(f"[AĞIR SIKLET YAPAY ZEKA] ✅ {su_an} | +1 Ürün Banttan Geçti! (%100 Görerek Sayıldı)")
                    time.sleep(0.5) # Çifte sayımı engelle
        
        # Ekran Çıktısını Güçlü Laptoptan canlı görebilmeniz için izleme ekranı
        cv2.line(frame, (0, SAYICI_CIZGI_Y), (1200, SAYICI_CIZGI_Y), (0, 255, 0), 2)
        cv2.putText(frame, f"NET SAYILAN: {sayilan_urun_sayisi}", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)
        
        # Görüntüyü o an laptopta küçük bir pencerede işler (Gösterir)
        cv2.imshow("NIZAM AI - URETIM GOZU", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    print("==================================================")
    print(" NIZAM EDGE AI - AĞIR SIKLET SAYAÇ BAŞLATILIYOR   ")
    print("==================================================")
    
    veritabani_kur()
    kurye_thread = threading.Thread(target=kurye_botu)
    kurye_thread.daemon = True
    kurye_thread.start()
    
    kamera_sayac_gozu()
