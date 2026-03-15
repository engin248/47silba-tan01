import os
import json
import time
import requests
from bs4 import BeautifulSoup
from supabase import create_client, Client
from datetime import datetime

# =========================================================================
# THE ORDER - 1. EKİP (VERİ MADENCİSİ / SCOUT AJANI)
# Görevi: Sadece veri toplar. Karar vermez, skorlamaz.
# Hedef: Trendyol Erkek/Kadın Giyim veya Rakip Siteler.
# =========================================================================

# SUPABASE BAĞLANTISI (Kendi güvenli .env dosyanızdan almalıdır)
SUPABASE_URL = os.environ.get("SUPABASE_URL", "GIZLI_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "GIZLI_KEY")

def baglanti_kur() -> Client:
    try:
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"[HATA] Veritabanı bağlantısı koptu: {e}")
        exit(1)

# ANTİ-BLOKAJ ZIRHI: İnsan gibi davranan tarayıcı kimlikleri
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
}

def trendyol_veri_madenciligi(arama_kelimesi="erkek kargo pantolon", limit=5):
    print(f"📡 [AJAN-1 SCOUT] '{arama_kelimesi}' için tarama başlatılıyor...")
    # Basit bir arama URL'si
    url = f"https://www.trendyol.com/sr?q={arama_kelimesi.replace(' ', '%20')}"
    
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        if response.status_code != 200:
            print(f"[BLOKAJ] Hedef site erişimi reddetti (Durum Kodu: {response.status_code}).")
            return []

        soup = BeautifulSoup(response.content, "html.parser")
        urun_kartlari = soup.find_all("div", class_="p-card-wrppr", limit=limit)
        
        toplanan_veriler = []
        for kart in urun_kartlari:
            try:
                # Link
                link_etiketi = kart.find("a")
                kaynak_url = "https://www.trendyol.com" + link_etiketi["href"] if link_etiketi else ""
                
                # Görsel
                img_etiketi = kart.find("img")
                gorsel_url = img_etiketi["src"] if img_etiketi else ""
                
                # Marka ve İsim
                marka_etiketi = kart.find("span", class_="prdct-desc-cntnr-ttl")
                isim_etiketi = kart.find("span", class_="prdct-desc-cntnr-name")
                
                marka = marka_etiketi.text.strip() if marka_etiketi else "Bilinmeyen Marka"
                isim = isim_etiketi.text.strip() if isim_etiketi else "Bilinmeyen Ürün"
                
                # Fiyat
                fiyat_etiketi = kart.find("div", class_="prc-box-dscntd")
                fiyat = fiyat_etiketi.text.strip() if fiyat_etiketi else "0 TL"
                
                # Değerlendirme & Yorum (Sinyal/Trend belirtisi)
                yorum_etiketi = kart.find("span", class_="ratingCount")
                yorum_sayisi = yorum_etiketi.text.strip().replace("(", "").replace(")", "") if yorum_etiketi else "0"
                
                # Ham Veriyi (JSONB) paketle
                ham_veri = {
                    "marka": marka,
                    "urun_adi": isim,
                    "fiyat": fiyat,
                    "yorum_sayisi": yorum_sayisi,
                    "gorsel_url": gorsel_url,
                    "arama_kriteri": arama_kelimesi,
                    "yakalanma_tarihi": datetime.now().isoformat()
                }
                
                toplanan_veriler.append({
                    "hedef_platform": "Trendyol",
                    "kaynak_url": kaynak_url.split("?")[0], # Parametreleri at, temiz link kalsın (UNIQUE için)
                    "ham_veri": ham_veri,
                    "toplayan_ajan": "Ajan-1-Scout"
                })
                
            except Exception as e:
                print(f"[ATLAMA] Bir ürün kartı okunamadı: {e}")
                continue
                
        return toplanan_veriler

    except Exception as e:
        print(f"[HATA] Kazıma işlemi çöktü: {e}")
        return []

def veritabanina_firlat(veriler, db: Client):
    if not veriler:
        print("⚠️ Veritabanına atılacak veri bulunamadı.")
        return

    basarili_kayit = 0
    kopya_kayit = 0

    for veri in veriler:
        try:
            # 2. Ekibin SQL yasasına göre 'b1_istihbarat_ham' tablosuna basıyoruz
            response = db.table("b1_istihbarat_ham").insert(veri).execute()
            basarili_kayit += 1
            print(f"✅ KAYDEDİLDİ: {veri['ham_veri']['marka']} - {veri['ham_veri']['fiyat']}")
        except Exception as e:
            # UNIQUE Constraint eklendiği için aynı url varsa hata verecektir.
            if "duplicate key value" in str(e) or "23505" in str(e):
                kopya_kayit += 1
                # Sessizce yut, terminali kirletme
            else:
                print(f"❌ SUPABASE HATASI: {e}")

    print(f"\n📊 OPERASYON ÖZETİ: {basarili_kayit} Yeni Ürün Madenlendi | {kopya_kayit} Mükerrer Link Reddedildi.")

if __name__ == "__main__":
    print("=== NİZAM: 1. EKİP (VERİ MADENCİSİ) AKTİF ===")
    supabase_db = baglanti_kur()
    
    hedefler = [
        "erkek kargo pantolon",
        "erkek oversize tişört",
        "kadın keten gömlek"
    ]
    
    for hedef in hedefler:
        kazilan_veriler = trendyol_veri_madenciligi(arama_kelimesi=hedef, limit=10)
        veritabanina_firlat(kazilan_veriler, supabase_db)
        # Sitelere saldırı olarak algılanmamak için insan gibi bekle
        time.sleep(3)
    
    print("=== GÖREV TAMAMLANDI. TOPLANAN VERİLER 2. EKİBİN YARGISINA BIRAKILDI ===")
