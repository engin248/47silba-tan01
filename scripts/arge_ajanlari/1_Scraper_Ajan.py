import os
import json
import time
import requests
import re
from pathlib import Path
from bs4 import BeautifulSoup
from supabase import create_client, Client
from datetime import datetime
from dotenv import load_dotenv

# =========================================================================
# THE ORDER - 1. EKİP (VERİ MADENCİSİ / SCOUT AJANI) - DETAYLI VERSİYON
# Görevi: Trendyol üzerinden detaylı (15 Kriter) Veri Madenciliği
# Hedef Tablo: b1_trendyol_istihbarat_detayli
# =========================================================================

SCRIPT_DIR = Path(__file__).resolve().parent
load_dotenv(SCRIPT_DIR / ".env")

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("🔴 [KRİTİK HATA] .env dosyasında SUPABASE_URL veya SUPABASE_SERVICE_KEY bulunamadı!")
    exit(1)

def baglanti_kur() -> Client:
    try:
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"[HATA] Veritabanı bağlantısı koptu: {e}")
        exit(1)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept": "text/html,application/xhtml+xml,application/xml",
}

gunler_tr = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"]

def arama_sonuclarini_getir(arama_kelimesi, limit=5):
    print(f"📡 [AJAN-1] '{arama_kelimesi}' aranıyor...")
    url = f"https://www.trendyol.com/sr?q={arama_kelimesi.replace(' ', '%20')}"
    
    try:
        response = requests.get(url, headers=HEADERS, timeout=15)
        soup = BeautifulSoup(response.content, "html.parser")
        urun_kartlari = soup.find_all("div", class_="p-card-wrppr", limit=limit)
        
        linkler = []
        for kart in urun_kartlari:
            link_etiketi = kart.find("a")
            if link_etiketi:
                link = "https://www.trendyol.com" + link_etiketi["href"].split("?")[0]
                linkler.append(link)
        return linkler
    except Exception as e:
        print(f"❌ [HATA] Arama yapılırken çöktü: {e}")
        return []

def urun_detaylarini_cek(urun_linki):
    print(f"   - Detaylara Giriliyor: {urun_linki}")
    try:
        response = requests.get(urun_linki, headers=HEADERS, timeout=15)
        if response.status_code != 200:
            print(f"   ! Sayfa Reddedildi (Kod: {response.status_code})")
            return None
            
        html_content = response.text
        
        # Trendyol'un sayfa içine gömdüğü devasa JSON verisini regex ile yakala
        # __PRODUCT_DETAIL_APP_INITIAL_STATE__ bölümünde orijinal veriler var
        state_match = re.search(r'window\.__PRODUCT_DETAIL_APP_INITIAL_STATE__\s*=\s*({.*?});\s*window\.', html_content)
        
        if not state_match:
            print("   ! Ürün API durumu JSON bulunamadı, klasik DOM atlanıyor.")
            return None
            
        json_str = state_match.group(1)
        data = json.loads(json_str)
        product = data.get("product", {})
        
        # --- 15 KRİTERİ TOPLAMA ---
        
        # 1. Marka
        marka_ismi = product.get("brand", {}).get("name", "Bilinmeyen Marka")
        
        # 2. İsim
        urun_ismi = product.get("name", "Bilinimsiz Ürün")
        
        # 3. Orijinal & 4. İndirimli Fiyat
        price_info = product.get("price", {})
        orijinal_fiyat = price_info.get("originalPrice", {"value": 0}).get("value", 0)
        indirimli_fiyat = price_info.get("discountedPrice", {"value": 0}).get("value", 0)
        
        # 5. Ürün Puanı
        rating_info = product.get("ratingScore", {})
        urun_puani = rating_info.get("averageRating", 0.0)
        
        # 6. Ürün Yorum Sayısı (veya Yorumlar)
        urun_yorumlari = str(product.get("reviewCount", 0)) + " yorum yapilmish"
        
        # 7. Ürün Özellikleri (Renk, Kumaş, vs.)
        ozellikler_listesi = product.get("attributes", [])
        urun_ozellikleri = {item.get('key', {}).get('name', 'Bilinmeyen'): item.get('value', {}).get('name', '') for item in ozellikler_listesi}
        
        # 8. Yorum Özeti (Şimdilik boş bırakıyoruz, ilerde AI ile doldurulabilir)
        urun_yorum_ozeti = "Ozet analiz edilmedi."
        
        # Sosyal Kanıt verileri (Sepet ve Görüntüleme)
        sepete_ekleme = "Bilinmiyor"
        goruntuleme = "Bilinmiyor"
        urun_favorisi = str(product.get("favoriteCount", 0)) + " Favori"
        
        social_proof_html = re.search(r'class="view-info-text">(.*?)</div>', html_content)
        if social_proof_html:
            sp_text = social_proof_html.group(1)
            if "sepet" in sp_text.lower():
                sepete_ekleme = sp_text
            elif "görüntüleniyor" in sp_text.lower() or "inceledi" in sp_text.lower():
                goruntuleme = sp_text
                
        # 13. Fotoğraf URL
        images = product.get("images", [])
        urun_fotografi = "https://cdn.dsmcdn.com" + images[0] if len(images) > 0 else ""
        
        # 14. Yorum Tarihi (Ürün statik datasında yok, genel bırakıyoruz)
        urun_yorum_tarihi = "Belirsiz"
        
        # 15. Ürün Değerlendirme (Total Rating Count)
        urun_degerlendirme = str(rating_info.get("totalRatingCount", 0)) + " degerlendirme"
        
        tarih = datetime.now()
        
        return {
            "marka_ismi": marka_ismi,
            "urun_ismi": urun_ismi,
            "orijinal_fiyat": orijinal_fiyat,
            "indirimli_fiyat": indirimli_fiyat,
            "urun_puani": urun_puani,
            "urun_yorumlari": urun_yorumlari,
            "urun_ozellikleri": urun_ozellikleri,
            "urun_yorum_ozeti": urun_yorum_ozeti,
            "sepete_ekleme": sepete_ekleme,
            "goruntuleme": goruntuleme,
            "urun_favorisi": urun_favorisi,
            "urun_linki": urun_linki,
            "urun_fotografi": urun_fotografi,
            "urun_yorum_tarihi": urun_yorum_tarihi,
            "urun_degerlendirme": urun_degerlendirme,
            "cekilen_tarih": tarih.strftime("%Y-%m-%d"),
            "cekilen_gun": gunler_tr[tarih.weekday()],
            "toplayan_ajan": "Ajan-1-Detayli-Scout",
            "hedef_platform": "Trendyol"
        }
    except Exception as e:
        print(f"   ! HATA: {e}")
        return None

def veriyi_dogrula(v):
    """
    Supabase'e gitmeden once verinin 15 kritere uygun olup olmadigini kati bir sekilde denetler.
    Eksik veya hatali veri varsa False doner ve loglar.
    """
    hatalar = []
    
    # Kural 1: Marka ve İsim boş olamaz
    if not v.get("marka_ismi") or v.get("marka_ismi") == "Bilinmeyen Marka":
        hatalar.append("Marka ismi eksik")
    if not v.get("urun_ismi") or v.get("urun_ismi") == "Bilinimsiz Ürün":
        hatalar.append("Urun ismi eksik")
        
    # Kural 2: Fiyatlar 0'dan büyük olmalı (Gerçekçi bir ürün olmalı)
    try:
        if float(v.get("orijinal_fiyat", 0)) <= 0 and float(v.get("indirimli_fiyat", 0)) <= 0:
            hatalar.append(f"Gecerli bir fiyat bulunamadi (Orj: {v.get('orijinal_fiyat')} Ind: {v.get('indirimli_fiyat')})")
    except ValueError:
        hatalar.append("Fiyat formati hatali")
        
    # Kural 3: Ürün linki ve fotoğrafı kesinlikle olmalı (Boş string olmamalı)
    if not v.get("urun_linki"):
        hatalar.append("Urun linki eksik")
    if not v.get("urun_fotografi"):
        hatalar.append("Urun fotografi eksik")
        
    # Kural 4: Özellikler (Kumaş/Renk) tamamen boş olmamalı (Trendyol'da en azından 1 özellik olur)
    if not v.get("urun_ozellikleri") or len(v.get("urun_ozellikleri")) == 0:
        hatalar.append("Urun ozellikleri (Renk/Kumas vs.) bulunamadi")

    if hatalar:
        print(f"   - [RET] Eksik Veri Tespit Edildi ({v.get('hedef_platform')}): {', '.join(hatalar)}")
        return False
        
    return True

def veritabanina_firlat(veriler, db: Client):
    basarili = 0
    kopya = 0
    hatali = 0
    
    for v in veriler:
        if v is None: continue
        
        # SIKI KALİTE KONTROL (VALIDASYON)
        if not veriyi_dogrula(v):
            hatali += 1
            continue
            
        try:
            db.table("b1_trendyol_istihbarat_detayli").insert(v).execute()
            print(f"   + EKLENDI (15 Kriter Onayli): {v['marka_ismi']}")
            basarili += 1
        except Exception as e:
            if "duplicate key value" in str(e) or "23505" in str(e):
                kopya += 1
            else:
                print(f"   ! DB YAZMA HATASI: {e}")
                
    print(f"\n📊 ÖZET: {basarili} kaliteli ürün eklendi. {kopya} mükerrer. {hatali} eksik veri nedeniyle reddedildi.")


if __name__ == "__main__":
    print("=== NİZAM: 1. EKİP (DETAYLI ve KALİTE KONTROLLÜ BİLGİ TOPLAYICI) BAŞLATILDI ===")
    supabase_db = baglanti_kur()
    
    hedefler = [
        "erkek kargo pantolon",
        "erkek oversize tişört"
    ]
    
    for hedef in hedefler:
        linkler = arama_sonuclarini_getir(hedef, limit=5) # Test için 5 limit
        
        detayli_veriler = []
        for index, link in enumerate(linkler):
            detay = urun_detaylarini_cek(link)
            if detay:
                detayli_veriler.append(detay)
            # İnsan gibi davran
            time.sleep(2)
            
        veritabanina_firlat(detayli_veriler, supabase_db)
        
    print("=== GÖREV TAMAMLANDI ===")
