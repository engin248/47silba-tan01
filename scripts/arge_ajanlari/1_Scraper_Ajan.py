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
# THE ORDER - 1. EKİP (GOZLEM AJANI)
# Gorev: Kamuya acik Trendyol urun sayfalarini oku, degisikligi kaydet
# Hedef Tablo: b1_piyasa_gozlem
# Etik Kural: Sadece herhangi bir ziyaretcinin gorebilecegi bilgi alinir.
#             Guvenlik atlatilmaz, sistem kirilmaz.
# =========================================================================

try:
    SCRIPT_DIR = Path(__file__).resolve().parent
except NameError:
    SCRIPT_DIR = Path(os.getcwd()).resolve()

load_dotenv(SCRIPT_DIR / ".env")

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[KRITIK HATA] .env dosyasinda SUPABASE_URL veya SUPABASE_SERVICE_KEY bulunamadi!")
    exit(1)

def baglanti_kur() -> Client:
    try:
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"[HATA] Veritabani baglantisi koptu: {e}")
        exit(1)

# Standart tarayici kimligini taklit et (dost niyetli bot)
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

GUNLER = ["Pazartesi", "Sali", "Carsamba", "Persembe", "Cuma", "Cumartesi", "Pazar"]

# =========================================================================
# Arama Kriteri → Urun Linki Listesi
# =========================================================================
def arama_linklerini_getir(arama_kriteri: str, limit: int = 5):
    print(f"[TARAMA] '{arama_kriteri}' araniyor...")
    url = f"https://www.trendyol.com/sr?q={arama_kriteri.replace(' ', '%20')}"
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        # Cloudflare engeli kontrolu
        if r.status_code == 403 or "Attention Required" in r.text:
            print(f"  [ENGEL] Trendyol erisimi reddetti. Bu arama kriteri atlaniyor: {arama_kriteri}")
            return []
        soup = BeautifulSoup(r.content, "html.parser")
        kartlar = soup.find_all("div", class_="p-card-wrppr", limit=limit)
        linkler = []
        for kart in kartlar:
            a = kart.find("a")
            if a and a.get("href"):
                linkler.append("https://www.trendyol.com" + a["href"].split("?")[0])
        print(f"  [OK] {len(linkler)} urun linki bulundu.")
        return linkler
    except Exception as e:
        print(f"  [HATA] Arama sirasinda hata: {e}")
        return []

# =========================================================================
# Urun Sayfasini Gozlemle → Veri Paketi Olustur
# =========================================================================
def urunu_gozlemle(urun_linki: str, arama_kriteri: str):
    try:
        r = requests.get(urun_linki, headers=HEADERS, timeout=15)
        if r.status_code != 200 or "Attention Required" in r.text:
            print(f"  [ATLANDI] Sayfa erisimi reddedildi: {urun_linki}")
            return None

        html = r.text

        # Trendyol'un sayfaya gomulu JSON verisini oku
        m = re.search(r'window\.__PRODUCT_DETAIL_APP_INITIAL_STATE__\s*=\s*({.*?});\s*window\.', html)
        if not m:
            print(f"  [ATLANDI] Sayfa JSON verisi bulunamadi: {urun_linki}")
            return None

        data = json.loads(m.group(1))
        product = data.get("product", {})
        price   = product.get("price", {})
        rating  = product.get("ratingScore", {})
        attrs   = product.get("attributes", [])
        images  = product.get("images", [])

        # --- 15 KRİTER ---
        marka_ismi          = product.get("brand", {}).get("name", "")
        urun_ismi           = product.get("name", "")
        orijinal_fiyat      = price.get("originalPrice", {}).get("value", 0)
        indirimli_fiyat     = price.get("discountedPrice", {}).get("value", 0)
        urun_puani          = rating.get("averageRating", 0.0)
        yorum_sayisi        = int(product.get("reviewCount", 0))
        degerlendirme_sayisi = int(rating.get("totalRatingCount", 0))
        urun_ozellikleri    = {
            a.get("key", {}).get("name", "?"): a.get("value", {}).get("name", "")
            for a in attrs
        }
        urun_fotografi_url  = ("https://cdn.dsmcdn.com" + images[0]) if images else ""
        urun_favorisi       = str(product.get("favoriteCount", 0))

        # Sepete ekleme / goruntulenme (sozyal kanit metni)
        sepete_ekleme = None
        goruntuleme   = None
        sp = re.search(r'class="view-info-text">(.*?)</div>', html)
        if sp:
            sp_text = sp.group(1)
            if "sepet" in sp_text.lower():
                sepete_ekleme = sp_text
            elif "incele" in sp_text.lower() or "goruntule" in sp_text.lower():
                goruntuleme = sp_text

        # Stok durumu
        stok = product.get("productGroupAttribute", {}).get("stock", None)
        stok_durumu = "Stokta" if stok else "Belirsiz"

        # Kategori ve cinsiyet tahmini (urun ismi ve ozellikleri uzerinden)
        isim_lower = urun_ismi.lower()
        hedef_cinsiyet = (
            "Erkek" if "erkek" in isim_lower
            else "Kadin" if any(k in isim_lower for k in ["kadin","kadin","bayan"])
            else "Unisex"
        )

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
            "urun_yorum_ozeti":     None,   # AI (Yargic) dolduracak
            "sepete_ekleme":        sepete_ekleme,
            "goruntuleme":          goruntuleme,
            "urun_favorisi":        urun_favorisi,
            "urun_linki":           urun_linki,
            "urun_fotografi_url":   urun_fotografi_url,
            "son_yorum_tarihi":     None,
            "degerlendirme_sayisi": degerlendirme_sayisi,
            # AI tahmin alanlari
            "stok_durumu":          stok_durumu,
            "kategori":             None,   # Yargic dolduracak
            "hedef_cinsiyet":       hedef_cinsiyet,
            "tahmini_sezon":        None,   # Yargic dolduracak
            "arama_kriteri":        arama_kriteri,
            "hedef_platform":       "Trendyol",
            "onceki_fiyat":         None,
            "fiyat_degisim_yonu":   "YENİ",
            "ai_trend_skoru":       None,   # Yargic dolduracak
            "ai_analiz_notu":       None,   # Yargic dolduracak
            # Sistem
            "gozlem_tarihi":        tarih.strftime("%Y-%m-%d"),
            "gozlem_gunu":          GUNLER[tarih.weekday()],
            "toplayan_ajan":        "Ajan-1-Gozlemci",
            "islenmis":             False,
        }

    except Exception as e:
        print(f"  [HATA] Urun gozlemlenemedi: {e}")
        return None

# =========================================================================
# Validasyon: 4 Temel Kural
# =========================================================================
def veriyi_dogrula(v: dict) -> bool:
    hatalar = []
    if not v.get("marka_ismi"):
        hatalar.append("marka_ismi bos")
    if not v.get("urun_ismi"):
        hatalar.append("urun_ismi bos")
    try:
        if float(v.get("orijinal_fiyat") or 0) <= 0 and float(v.get("indirimli_fiyat") or 0) <= 0:
            hatalar.append(f"fiyat sifir (Orj:{v.get('orijinal_fiyat')} Ind:{v.get('indirimli_fiyat')})")
    except (ValueError, TypeError):
        hatalar.append("fiyat formati hatali")
    if not v.get("urun_linki"):
        hatalar.append("urun_linki bos")
    if not v.get("urun_fotografi_url"):
        hatalar.append("fotografi yok")
    if not v.get("urun_ozellikleri"):
        hatalar.append("ozellikler bos")

    if hatalar:
        print(f"  [RET] {v.get('urun_ismi','?')} — {', '.join(hatalar)}")
        return False
    return True

# =========================================================================
# Supabase'e Yaz
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
            print(f"  [OK] Eklendi: {v['marka_ismi']} - {v['urun_ismi'][:40]}")
            eklendi += 1
        except Exception as e:
            if "duplicate key" in str(e) or "23505" in str(e):
                mukerrer += 1
            else:
                print(f"  [DB HATA] {e}")
    print(f"\n--- OZET: {eklendi} eklendi | {mukerrer} mukerrer | {reddedildi} reddedildi ---")

# =========================================================================
# ANA PROGRAM
# =========================================================================
if __name__ == "__main__":
    print("=== NIZAM: 1. EKIP (GOZLEM AJANI) BASLADI ===")
    db = baglanti_kur()

    # TEST MODU: Gercek urun linkleri (tarayici ile alinmis)
    # Ileride bu liste dinamik olarak doldurulacak
    TEST_LINKLERI = [
        ("https://www.trendyol.com/vikunya/erkek-siyah-jogger-kaliteli-pamuklu-likrali-cargo-beli-ve-pacasi-lastikli-kargo-cepli-pantolon-p-830527994", "erkek kargo pantolon"),
        ("https://www.trendyol.com/wafra/erkek-boy-friend-kot-pantolon-kargo-cepli-bel-ve-paca-lastikli-p-889937004", "erkek kargo pantolon"),
        ("https://www.trendyol.com/elitwear/erkek-kargo-cepli-gabardin-baggy-pantolon-p-815403833", "erkek kargo pantolon"),
    ]

    sonuclar = []
    for link, kriter in TEST_LINKLERI:
        print(f"\n[TEST] Gozlemleniyor: {link}")
        veri = urunu_gozlemle(link, kriter)
        sonuclar.append(veri)
        time.sleep(2)

    veritabanina_isle(sonuclar, db)
    print("=== GOREV TAMAMLANDI ===")

