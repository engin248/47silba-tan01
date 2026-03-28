import os
import json
import time
import requests
<<<<<<< HEAD
import re
from pathlib import Path
from bs4 import BeautifulSoup
from supabase import create_client, Client
from datetime import datetime, date, timedelta
from dotenv import load_dotenv

# =========================================================================
# THE ORDER - 1. EKIP: GUNLUK GOZLEM + DELTA TAKIP AJANI
# Hedef Tablo : b1_piyasa_gozlem
# Calistirma  : Her gun sabah ayni saatte (cron / gorev zamanlayici)
# Etik Kural  : Sadece kamuya acik bilgi. Guvenlik atlatilmaz.
# =========================================================================

try:
    SCRIPT_DIR = Path(__file__).resolve().parent
except NameError:
    SCRIPT_DIR = Path(os.getcwd()).resolve()

load_dotenv(SCRIPT_DIR / ".env")

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[KRITIK] .env dosyasinda SUPABASE_URL veya SUPABASE_SERVICE_KEY bulunamadi!")
    exit(1)
=======
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
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552

def baglanti_kur() -> Client:
    try:
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
<<<<<<< HEAD
        print(f"[HATA] DB baglantisi: {e}")
        exit(1)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept-Language": "tr-TR,tr;q=0.9",
    "Accept": "text/html,application/xhtml+xml",
}

GUNLER = ["Pazartesi", "Sali", "Carsamba", "Persembe", "Cuma", "Cumartesi", "Pazar"]

# =========================================================================
# ONCEKI GOZLEMI GETIR — Delta hesaplamak icin dunkü kaydi bul
# =========================================================================
def onceki_gozlemi_getir(urun_linki: str, db: Client) -> dict | None:
    try:
        dun = (date.today() - timedelta(days=1)).isoformat()
        res = db.table("b1_piyasa_gozlem") \
                .select("yorum_sayisi, urun_favorisi, orijinal_fiyat") \
                .eq("urun_linki", urun_linki) \
                .eq("gozlem_tarihi", dun) \
                .limit(1) \
                .execute()
        if res.data:
            return res.data[0]
    except Exception as e:
        print(f"  [WARN] Onceki gozlem alinamadi: {e}")
    return None

# =========================================================================
# URUN SAYFASINI GOZLEMLE
# =========================================================================
def urunu_gozlemle(urun_linki: str, arama_kriteri: str, db: Client) -> dict | None:
    try:
        r = requests.get(urun_linki, headers=HEADERS, timeout=15)
        if r.status_code != 200 or "Attention Required" in r.text:
            print(f"  [ATLANDI] Erisim reddedildi ({r.status_code}): {urun_linki}")
            return None

        html = r.text
        m = re.search(r'window\.__PRODUCT_DETAIL_APP_INITIAL_STATE__\s*=\s*({.*?});\s*window\.', html)
        if not m:
            print(f"  [ATLANDI] JSON verisi bulunamadi: {urun_linki}")
            return None

        data    = json.loads(m.group(1))
        product = data.get("product", {})
        price   = product.get("price", {})
        rating  = product.get("ratingScore", {})
        attrs   = product.get("attributes", [])
        images  = product.get("images", [])

        # 15 KRİTER
        marka_ismi           = product.get("brand", {}).get("name", "")
        urun_ismi            = product.get("name", "")
        orijinal_fiyat       = price.get("originalPrice", {}).get("value", 0)
        indirimli_fiyat      = price.get("discountedPrice", {}).get("value", 0)
        urun_puani           = rating.get("averageRating", 0.0)
        yorum_sayisi         = int(product.get("reviewCount", 0))
        degerlendirme_sayisi = int(rating.get("totalRatingCount", 0))
        urun_ozellikleri     = {
            a.get("key", {}).get("name", "?"): a.get("value", {}).get("name", "")
            for a in attrs
        }
        urun_fotografi_url   = ("https://cdn.dsmcdn.com" + images[0]) if images else ""
        favori_ham           = product.get("favoriteCount", 0)
        urun_favorisi        = str(favori_ham)

        # Sosyal kanit
        sepete_ekleme = None
        goruntuleme   = None
        sp = re.search(r'class="view-info-text">(.*?)</div>', html)
        if sp:
            t = sp.group(1)
            if "sepet" in t.lower():
                sepete_ekleme = t
            else:
                goruntuleme = t

        # Cinsiyet tahmini
        il = urun_ismi.lower()
        hedef_cinsiyet = (
            "Erkek" if "erkek" in il
            else "Kadin" if any(k in il for k in ["kadin", "bayan"])
            else "Unisex"
        )

        # DELTA HESAPLAMA — dunkü kayda bak
        onceki       = onceki_gozlemi_getir(urun_linki, db)
        yorum_delta  = 0
        favori_delta = 0
        fiyat_yonu   = "YENİ"

        if onceki:
            yorum_delta  = yorum_sayisi - int(onceki.get("yorum_sayisi") or 0)
            favori_delta = favori_ham   - int(onceki.get("urun_favorisi") or 0)
            onceki_fiyat_val = float(onceki.get("orijinal_fiyat") or 0)
            if orijinal_fiyat > onceki_fiyat_val:
                fiyat_yonu = "YUKARI"
            elif orijinal_fiyat < onceki_fiyat_val:
                fiyat_yonu = "ASAGI"
            else:
                fiyat_yonu = "SABIT"
            print(f"  [DELTA] Yorum: {yorum_delta:+d} | Favori: {favori_delta:+d} | Fiyat: {fiyat_yonu}")

        tarih = datetime.now()

        return {
            # 15 kriter
            "marka_ismi":           marka_ismi,
            "urun_ismi":            urun_ismi,
            "orijinal_fiyat":       orijinal_fiyat,
            "indirimli_fiyat":      indirimli_fiyat,
            "urun_puani":           urun_puani,
            "yorum_sayisi":         yorum_sayisi,
            "urun_ozellikleri":     urun_ozellikleri,
            "urun_yorum_ozeti":     None,
            "sepete_ekleme":        sepete_ekleme,
            "goruntuleme":          goruntuleme,
            "urun_favorisi":        urun_favorisi,
            "urun_linki":           urun_linki,
            "urun_fotografi_url":   urun_fotografi_url,
            "son_yorum_tarihi":     None,
            "degerlendirme_sayisi": degerlendirme_sayisi,
            # AI tahmin
            "stok_durumu":          "Belirsiz",
            "kategori":             None,
            "hedef_cinsiyet":       hedef_cinsiyet,
            "tahmini_sezon":        None,
            "arama_kriteri":        arama_kriteri,
            "hedef_platform":       "Trendyol",
            "onceki_fiyat":         float(onceki.get("orijinal_fiyat") or 0) if onceki else None,
            "fiyat_degisim_yonu":   fiyat_yonu,
            "ai_trend_skoru":       None,
            "ai_analiz_notu":       None,
            # Delta
            "yorum_delta":          yorum_delta,
            "favori_delta":         favori_delta,
            # Sistem
            "gozlem_tarihi":        tarih.strftime("%Y-%m-%d"),
            "gozlem_gunu":          GUNLER[tarih.weekday()],
            "toplayan_ajan":        "Ajan-1-Gozlemci",
            "islenmis":             False,
        }

    except Exception as e:
        print(f"  [HATA] Gozlem hatasi: {e}")
        return None

# =========================================================================
# VALIDASYON
# =========================================================================
def veriyi_dogrula(v: dict) -> bool:
    h = []
    if not v.get("marka_ismi"):   h.append("marka bos")
    if not v.get("urun_ismi"):    h.append("isim bos")
    if not v.get("urun_linki"):   h.append("link bos")
    try:
        if float(v.get("orijinal_fiyat") or 0) <= 0 and float(v.get("indirimli_fiyat") or 0) <= 0:
            h.append("fiyat sifir")
    except Exception:
        h.append("fiyat hatali")
    if not v.get("urun_fotografi_url"): h.append("fotograf yok")
    if not v.get("urun_ozellikleri"):   h.append("ozellik yok")
    if h:
        print(f"  [RET] {v.get('urun_ismi','?')[:30]} — {', '.join(h)}")
        return False
    return True

# =========================================================================
# SUPABASE'E YAZ
# =========================================================================
def veritabanina_isle(veriler: list, db: Client):
    eklendi = mukerrer = reddedildi = 0
    for v in veriler:
        if not v:
            continue
        if not veriyi_dogrula(v):
            reddedildi += 1
            continue
        try:
            db.table("b1_piyasa_gozlem").insert(v).execute()
            delta_bilgi = f"yorumD:{v['yorum_delta']:+d} favD:{v['favori_delta']:+d}"
            print(f"  [OK] {v['marka_ismi']} | {v['urun_ismi'][:35]} | {delta_bilgi}")
            eklendi += 1
        except Exception as e:
            if "duplicate key" in str(e) or "23505" in str(e):
                mukerrer += 1
            else:
                print(f"  [DB HATA] {e}")
    print(f"\n--- OZET: {eklendi} eklendi | {mukerrer} bugun zaten var | {reddedildi} reddedildi ---")

# =========================================================================
# TAKIP LISTESI — Supabase'den okur (b1_takip_listesi tablosu gelecekte)
# Simdilik sabit liste — her gun ayni urunler izlenir
# =========================================================================
TAKIP_LISTESI = [
    ("https://www.trendyol.com/vikunya/erkek-siyah-jogger-kaliteli-pamuklu-likrali-cargo-beli-ve-pacasi-lastikli-kargo-cepli-pantolon-p-830527994", "erkek kargo pantolon"),
    ("https://www.trendyol.com/wafra/erkek-boy-friend-kot-pantolon-kargo-cepli-bel-ve-paca-lastikli-p-889937004",                                    "erkek kargo pantolon"),
    ("https://www.trendyol.com/elitwear/erkek-kargo-cepli-gabardin-baggy-pantolon-p-815403833",                                                       "erkek kargo pantolon"),
]

# =========================================================================
# ANA PROGRAM
# =========================================================================
if __name__ == "__main__":
    print(f"=== NIZAM GOZLEM AJANI — {datetime.now().strftime('%Y-%m-%d %H:%M')} ===")
    db = baglanti_kur()

    sonuclar = []
    for link, kriter in TAKIP_LISTESI:
        print(f"\n[GOZLEM] {link.split('/')[-1][:50]}")
        veri = urunu_gozlemle(link, kriter, db)
        sonuclar.append(veri)
        time.sleep(2)

    veritabanina_isle(sonuclar, db)
    print("=== GOREV TAMAMLANDI ===")
=======
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
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
