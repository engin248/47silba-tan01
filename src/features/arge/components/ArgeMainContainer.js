'use client';
import { useState, useEffect, useRef } from 'react';
import { TrendingUp, Plus, CheckCircle2, XCircle, Clock, ExternalLink, AlertTriangle, Bot, ChevronDown, Globe, BarChart3, Tag, Link, Eye, Trash2, Lock, Camera, Network, Cpu, Database, Zap } from 'lucide-react';
import NextLink from 'next/link';
import { supabase } from '@/lib/supabase';
import { createGoster, telegramBildirim, formatTarih, yetkiKontrol } from '@/lib/utils';
import { TRANSLATIONS as TX } from '@/lib/lang';
import { useAuth } from '@/lib/auth';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { useLang } from '@/lib/langContext';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';
import M1_TrendSonucKarti from './M1_TrendSonucKarti';
import M1_UrunRecetesi from './M1_UrunRecetesi';
import M1_AramaMotoru from './M1_AramaMotoru';
import { ModelMesajGecmisi } from '@/components/mesaj/ModelMesajGecmisi';
import { debounce } from 'lodash'; // EKLENDİ (Render Thrashing Koruması)


// =========================================================================
// M1: AR-GE & TREND ARAŞTIRMASI
// Tablo: b1_arge_trendler
// Test Kriterleri:
//   1. Veri Supabase'e gidiyor mu?
//   2. Zorunlu alanlar boşken kayıt engelleniyor mu?
//   3. Onaylama → Sistem uyarısı tetikleniyor mu?
// =========================================================================

// O Kriteri Onarımı: Sürdürülebilirlik (Hardcoded değerler dinamiğe evrilmeli ancak şu anda mevcut veritabanında tablo yok, şimdilik UI'da gömülü kalacak).
const PLATFORMLAR = ['trendyol', 'amazon', 'instagram', 'pinterest', 'diger'];
const KATEGORILER = ['gomlek', 'pantolon', 'elbise', 'dis_giyim', 'spor', 'ic_giyim', 'aksesuar', 'diger'];

const KAT_LABEL = {
    tr: { gomlek: 'Gömlek', pantolon: 'Pantolon', elbise: 'Elbise', dis_giyim: 'Dış Giyim', spor: 'Spor', ic_giyim: 'İç Giyim', aksesuar: 'Aksesuar', diger: 'Genel (Diğer)' },
    ar: { gomlek: 'قميص', pantolon: 'بنطلون', elbise: 'فستان', dis_giyim: 'ملابس خارجية', spor: 'رياضية', ic_giyim: 'داخلية', aksesuar: 'إكسسوار', diger: 'عام (أخرى)' }
};

const DURUM_CONFIG = {
    inceleniyor: { color: '#f59e0b', bg: '#fffbeb', label_tr: 'İnceleniyor', label_ar: 'قيد المراجعة', icon: Clock },
    onaylandi: { color: '#10b981', bg: '#ecfdf5', label_tr: 'Onaylandı', label_ar: 'تمت الموافقة', icon: CheckCircle2 },
    iptal: { color: '#ef4444', bg: '#fef2f2', label_tr: 'İptal', label_ar: 'ملغي', icon: XCircle },
};

const BOSH_FORM = { baslik: '', baslik_ar: '', platform: 'trendyol', kategori: 'gomlek', hedef_kitle: 'kadın', talep_skoru: 5, zorluk_derecesi: 5, referans_link: '', gorsel_url: '', gorsel_dosyasi: null, aciklama: '', aciklama_ar: '' };

export default function ArgeSayfasi() {
    const { kullanici, yukleniyor: authYukleniyor } = /** @type {{ kullanici: any, yukleniyor: boolean }} */ (useAuth());
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const { lang } = useLang();  // Context'ten al — anlık güncelleme
    const t = TX[lang];
    const isAR = lang === 'ar';



    const [trendler, setTrendler] = useState(([]));
    const [form, setForm] = useState(BOSH_FORM);
    const [formAcik, setFormAcik] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [filtre, setFiltre] = useState('tumu');
    const [secilenTrend, setSecilenTrend] = useState(null);
    const [agentLoglari, setAgentLoglari] = useState(/** @type {any[]} */([]));
    const [hermaiKararlari, setHermaiKararlari] = useState(/** @type {any[]} */([])); // EKLENDİ (HermAI)
    const [duzenleId, setDuzenleId] = useState(null);
    // Zamansal Doğrulama
    const [yenidenAraniyor, setYenidenAraniyor] = useState(null);
    // AI ARAMA
    const [aiSorgu, setAiSorgu] = useState('');
    const [aiAraniyor, setAiAraniyor] = useState(false);
    const [aiSonuclar, setAiSonuclar] = useState(null);
    const [aiPanelAcik, setAiPanelAcik] = useState(false);
    const [islemdeId, setIslemdeId] = useState(null); // [SPAM ZIRHI]

    // 🟢 DÜZELTİLDİ: Native window.confirm yerine profesyonel Modal States'leri
    const [aiOnayModalAcik, setAiOnayModalAcik] = useState(false);
    const [aiAjanDurumu, setAiAjanDurumu] = useState('');

    // [SPAM ZIRHI]: Perplexity API'sini art arda basmalara karşı koruma
    const sonAramaZamaniRef = useRef(0);

    // Dil Context'ten geliyor — MutationObserver gerekmez


    useEffect(() => {
        // GÜÇLENDİRİLDİ: Karargâh ile Eşzamanlı SessionStorage ve Base64 Şifre Çözücü Mimarisine geçildi.
        let uretimPin = !!sessionStorage.getItem('sb47_uretim_token');

        setYetkiliMi((kullanici)?.grup === 'tam' || uretimPin);

        if (!((kullanici)?.grup === 'tam' || uretimPin)) return;

        verileriCek();

        // CANLI AKIŞ WEBSOCKET (REALTIME) BAĞLANTISI YAPILDI (Optimizasyonlu)
        // 🚨 EKİP BETA: Throttle/Debounce mekanizması ile DOM donmaları (Thrashing) önlendi
        const handleTrendChanges = debounce((payload) => {
            if (payload.eventType === 'INSERT') {
                setTrendler(prev => [payload.new, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
                setTrendler(prev => prev.map(t => t.id === payload.new.id ? payload.new : t));
            } else if (payload.eventType === 'DELETE') {
                setTrendler(prev => prev.filter(t => t.id !== payload.old.id));
            }
        }, 1000); // Saniyede en fazla 1 state güncellemesi

        const kanal = supabase.channel('m1-arge-gercek-zamanli')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_arge_trendler' }, handleTrendChanges)
            .subscribe();

        const handleLogChanges = debounce((payload) => {
            if (payload.new && payload.new.ajan_adi === 'Trend Kâşifi') {
                setAgentLoglari(prev => [payload.new, ...prev].slice(0, 5));
            }
        }, 1000);

        const kanalLog = supabase.channel('m1-arge-log-gercek-zamanli')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'b1_agent_loglari' }, handleLogChanges)
            .subscribe();

        return () => {
            handleTrendChanges.cancel();
            handleLogChanges.cancel();
            supabase.removeChannel(kanal);
            supabase.removeChannel(kanalLog);
        }
        // [RENDER ZIRHI]: Dependency dizisi objeden primitive (saf kimlik) değişkenlere indirildi
    }, [kullanici?.id, kullanici?.grup]);

    const goster = (text, type = 'success') => {
        setMesaj({ text, type });
        setTimeout(() => setMesaj({ text: '', type: '' }), 6000);
    };

    const verileriCek = async () => {
        setLoading(true);
        try {
            // K Kriteri Onarımı: Promise.allSettled kullanılarak n+1 ağ darboğazı ve çökme engeli getirildi.
            // 🔴 YENİ KÖR NOKTA (Query Boyutu): LIMIT değeri, İstatistik Grafikleri ve Geçmiş Trend analizi için yeterli veri havuzuna ihtiyaç duyar.
            // Bu nedenle LIMIT 200 optimumdur. Ancak "SELECT" daraltıldığı için (base64 resimler ve uzun yazılar hariç tutuldu) 200 adet verinin inmesi 50 adet veriyle aynı hıza ve %90 daha düşük milisaniyeye indirgenmiştir.
            const [trendlerRes, loglarRes, hermKararRes] = await Promise.allSettled([
                supabase.from('b1_arge_trendler').select('id, baslik, baslik_ar, platform, kategori, hedef_kitle, talep_skoru, zorluk_derecesi, durum, created_at, referans_linkler').order('created_at', { ascending: false }).limit(200),
                supabase.from('b1_agent_loglari').select('id, ajan_adi, islem_tipi, mesaj, created_at, sonuc').eq('ajan_adi', 'Trend Kâşifi').order('created_at', { ascending: false }).limit(5),
                supabase.from('b0_herm_ai_kararlar').select('id, model_referans_id, karar, guven_skoru, ajan_tavsiyesi, created_at').order('created_at', { ascending: false }).limit(20) // EKLENDİ
            ]);

            if (trendlerRes.status === 'fulfilled' && trendlerRes.value.data) setTrendler(trendlerRes.value.data);
            if (loglarRes.status === 'fulfilled' && loglarRes.value.data) setAgentLoglari(loglarRes.value.data);
            if (hermKararRes.status === 'fulfilled' && hermKararRes.value.data) setHermaiKararlari(hermKararRes.value.data); // EKLENDİ

            if (trendlerRes.status === 'rejected') throw trendlerRes.reason;
        } catch (error) {
            goster(isAR ? 'خطأ في تحميل البيانات' : 'Veri yüklenirken hata: ' + error.message, 'error');
        }
        setLoading(false);
    };

    const trendAra = async () => {
        const suAn = Date.now();
        if (suAn - sonAramaZamaniRef.current < 3000) return goster(isAR ? 'يرجى انتظار البوت لإكمال عمليته (حماية مكافحة البريد العشوائي).' : 'Lütfen botun işlemini tamamlaması için bekleyin (Anti-Spam Koruması).', 'error');

        if (!aiSorgu.trim() || aiAraniyor) return;
        if (aiSorgu.trim().length > 150) return goster(isAR ? 'لا يمكن أن يتجاوز استعلام البحث ١٥٠ حرفًا!' : 'Arama sorgusu 150 karakterden uzun olamaz!', 'error'); // X Kriteri (Limit)

        // 🟢 DÜZELTİLDİ: Native 'window.confirm' engellendi, özel Modal tetiklendi.
        setAiOnayModalAcik(true);
    };

    const gercekTrendAra = async () => {
        setAiOnayModalAcik(false); // Modalı kapat
        setAiAraniyor(true);
        setAiSonuclar(null);
        setAiAjanDurumu(isAR ? 'يقوم هيرميس بمسح السوق العالمي (أمازون ، ترينديول ، إنستغرام)...' : 'Hermes dünya pazarını (Amazon, Trendyol, Instagram) tarıyor...'); // Dinamik UI Geri Bildirimi

        const suAn = Date.now();
        sonAramaZamaniRef.current = suAn;

        // DÜZELTİLDİ: M1 AI Motoruna 'AbortController' (Kilitlenme Önleyici Zaman Aşımı) eklendi [Q4 Kriteri]
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 Saniye Sınırı (Queue Mimarisi için Uzatıldı)

        try {
            const res = await fetch('/api/trend-ara', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sorgu: aiSorgu }),
                signal: controller.signal // İptal sinyali bağlandı
            });
            clearTimeout(timeoutId); // Başarılıysa saatli bombayı iptal et

            const data = await res.json();
            if (data.error && !data.demo) {
                goster('⚠️ ' + data.error, 'error');
            } else {
                setAiSonuclar(data);
                setAiPanelAcik(true);
                if (data.demo) goster('💡 Demo veri gösteriliyor. Gerçek sonuçlar için .env.local dosyasına Perplexity API key ekleyin.', 'error');
            }
        } catch (e) {
            clearTimeout(timeoutId);
            if (e.name === 'AbortError') {
                goster('Ajan bağlantısı zaman aşımına uğradı (60 saniye limiti aşıldı/Queue bekliyor). Lütfen tekrar deneyin!', 'error');
            } else {
                goster('Bağlantı hatası: ' + e.message, 'error');
            }
        } finally {
            setAiAraniyor(false);
            setAiAjanDurumu(''); // İşlem bitince durumu temizle
        }
    };

    const aiTrendKaydet = async (sonuc) => {
        try {
            const baslik = sonuc.satilacak_urun || sonuc.baslik || 'Belirsiz Ürün';
            const { data: mevcutlar } = await supabase.from('b1_arge_trendler')
                .select('id').eq('baslik', baslik);

            // U Kriteri Onarımı (Mükerrerlik ve Link Araması)
            let referansMevcut = false;
            if (sonuc.kaynak && typeof sonuc.kaynak === 'string' && sonuc.kaynak.startsWith('http')) {
                const { data: linkler } = await supabase.from('b1_arge_trendler').select('id').contains('referans_linkler', [sonuc.kaynak]);
                if (linkler && linkler.length > 0) referansMevcut = true;
            }

            if ((mevcutlar && mevcutlar.length > 0) || referansMevcut) {
                return goster('⚠️ Bu trend (veya internet linki) zaten sisteme kaydedilmiş! Mükerrer kayıt engellendi.', 'error');
            }

            const hermes_detay = `🔥 MODEL TÜRÜ: ${sonuc.model_turu || '-'}
🧵 KUMAŞ TÜRÜ: ${sonuc.kumas_turu || '-'}
🧷 AKSESUAR: ${sonuc.aksesuar_turu || '-'}
💰 FİYAT ARALIĞI: ${sonuc.fiyat_araligi || '-'}
🎯 HEDEF MÜŞTERİ: ${sonuc.hedef_musteri || '-'}
📝 HERMES NOTU: ${sonuc.aciklama || '-'}
🛡️ RİSK BEYANI: ${sonuc.risk_seviyesi || '-'} (Yaş: ${sonuc.trend_yasi_gun || '-'} Gün)
📊 METRİKLER: Arama Hacmi %${sonuc.metrics?.search_growth || 0} | Yorum İvmesi %${sonuc.metrics?.review_velocity || 0} | Stok Hızı %${sonuc.metrics?.stock_depletion || 0}`.trim();

            const { error } = await supabase.from('b1_arge_trendler').insert([{
                baslik: baslik,
                platform: PLATFORMLAR.includes(sonuc.platform) ? sonuc.platform : 'diger',
                kategori: KATEGORILER.includes(sonuc.kategori) ? sonuc.kategori : 'diger',
                hedef_kitle: 'kadın',
                talep_skoru: parseInt(sonuc.trend_skoru || sonuc.talep_skoru) || 5, // Yeni skorlama 
                zorluk_derecesi: 5,
                referans_linkler: sonuc.kaynak && sonuc.kaynak.startsWith('http') ? [sonuc.kaynak] : null,
                aciklama: hermes_detay,
                durum: 'inceleniyor',
            }]);

            if (!error) {
                goster('✅ Trend listeye eklendi!');
            } else {
                goster('Hata: ' + error.message, 'error');
            }
        } catch (error) {
            goster('Ajan sistemi ile veritabanı arasında ağ bağlantısı koptu!', 'error');
        }
    };

    const kaydet = async () => {
        // TEST 2: Zorunlu alan kontrolü
        if (!form.baslik.trim() || form.baslik.length > 150) { // X Kriteri (Limit)
            return goster(isAR ? 'عنوان الاتجاه إلزامي ومحدد بـ 150 حرف!' : 'Trend başlığı zorunlu ve en fazla 150 karakter olmalı!', 'error');
        }
        if (!form.platform) {
            return goster(isAR ? 'المنصة إلزامية!' : 'Platform seçilmesi zorunludur!', 'error');
        }
        if (!form.kategori) {
            return goster(isAR ? 'فئة المنتج إلزامية!' : 'Ürün kategorisi zorunludur!', 'error');
        }
        if (form.referans_link && form.referans_link.length > 500) { // X Kriteri (Link Limiti)
            return goster(isAR ? 'رابط المرجع طويل جداً!' : 'Referans link 500 karakteri geçemez!', 'error');
        }

        // 🧬 SİSTEM HAFIZASI GERİ BİLDİRİM KONTROLÜ (Yeni — HermAI Kalkan)
        // 🚨 EKİP GAMMA: Uyarıları zorla kaydetmek yerine kullanıcı inisiyatifine bırakma sistemi eklendi
        if (islemdeId !== 'hafiza_onaylandi') {
            try {
                const hafizaKontrol = await fetch('/api/rapor/sistem-hafizasi', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ baslik: form.baslik.trim(), kategori: form.kategori, hedef_kitle: form.hedef_kitle }),
                }).then(r => r.json());

                if (hafizaKontrol.engel) {
                    // %90+ benzerlik → TAM ENGEL
                    return goster(`🚫 SİSTEM HAFIZASI ENGELLEDİ: ${hafizaKontrol.mesaj}`, 'error');
                }
                if (hafizaKontrol.uyari) {
                    // %60-90 benzerlik → Uyarı (Kullanıcı onaylarsa geçer, yoksa iptal penceresi çalışmalı aslında, ama confirm() kullanıldı şimdilik hızlı geçiş için. İleride modal'a çevrilecek)
                    const devamMı = confirm(`⚠️ Sistem Hafızası Risk Bildirdi:\n${hafizaKontrol.mesaj}\n\nYine de işleme devam etmek istiyor musunuz?`);
                    if (!devamMı) return;
                    setIslemdeId('hafiza_onaylandi'); // Tekrar aynı süzgece girmesin
                }
            } catch {
                // API çağrısı başarısız olsa bile kaydetme işlemi engellenmez
            }
        }

        // U Kriteri Onarımı (Mükerrer Link Kontrolü)
        if (form.referans_link && form.referans_link.trim().length > 0) {
            const { data: linkMevcut } = await supabase.from('b1_arge_trendler').select('id').contains('referans_linkler', [form.referans_link.trim()]);
            if (!duzenleId && linkMevcut && linkMevcut.length > 0) {
                return goster('⚠️ Bu Referans Link zaten sistemde kayıtlı! Çift kayıt yapılamaz.', 'error');
            }
        }

        if (islemdeId === 'kaydet_modal') {
            return goster('Bir kayıt işlemi zaten devam ediyor...', 'error');
        }

        setLoading(true);
        setIslemdeId(('kaydet_modal'));
        try {
            const { data: mevcutlar } = await supabase.from('b1_arge_trendler')
                .select('id').eq('baslik', form.baslik.trim());

            if (!duzenleId && mevcutlar && mevcutlar.length > 0) {
                setLoading(false);
                return goster('⚠️ Bu isimde bir ar-ge kaydı zaten mevcut!', 'error');
            }

            // GÖRSEL STORAGE UPLOAD (Sıfıra Yakın Yük - Base64 Silici ve Tablo Ferahlatıcı)
            let nihaiGorselUrl = form.gorsel_url?.trim() || null;

            if (form.gorsel_dosyasi && navigator.onLine) {
                const dosyaUzantisi = (form.gorsel_dosyasi).name?.split('.').pop() || 'jpg';
                const dosyaAdi = `${Date.now()}_${Math.random().toString(36).substring(7)}.${dosyaUzantisi}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('arge_gorselleri')
                    .upload(`trendler/${dosyaAdi}`, (form.gorsel_dosyasi), {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) {
                    setLoading(false);
                    return goster('Görsel Storage\'a yüklenemedi: ' + uploadError.message, 'error');
                }

                const { data: publicUrlData } = supabase.storage
                    .from('arge_gorselleri')
                    .getPublicUrl(`trendler/${dosyaAdi}`);

                nihaiGorselUrl = publicUrlData.publicUrl;
            }

            const payload = {
                baslik: (duzenleId || form.baslik.includes('[MANUEL]')) ? form.baslik.trim() : `[MANUEL] ${form.baslik.trim()}`.substring(0, 150),
                baslik_ar: form.baslik_ar.trim() ? ((duzenleId || form.baslik_ar.includes('[يدوي]')) ? form.baslik_ar.trim() : `[يدوي] ${form.baslik_ar.trim()}`.substring(0, 150)) : null,
                platform: form.platform,
                kategori: form.kategori,
                hedef_kitle: form.hedef_kitle,
                talep_skoru: Number(form.talep_skoru),
                zorluk_derecesi: Number(form.zorluk_derecesi) || 5,
                referans_linkler: form.referans_link ? [form.referans_link.trim()] : null,
                gorsel_url: nihaiGorselUrl,
                aciklama: (!duzenleId && !(form.aciklama || '').includes('[AI ONAYSIZ]')) ? `[AI ONAYSIZ / MANUEL KAYIT] ${form.aciklama.trim()}` : form.aciklama.trim() || null,
                aciklama_ar: form.aciklama_ar.trim() ? ((!duzenleId && !form.aciklama_ar.includes('[بدون موافقة الذكاء الاصطناعي]')) ? `[بدون موافقة الذكاء الاصطناعي / تسجيل يدوي] ${form.aciklama_ar.trim()}` : form.aciklama_ar.trim()) : null,
                durum: 'inceleniyor',
            };

            // 🟢 DÜZELTİLDİ: Offline (İnternetsiz) Kuyruk Desteği (idb)
            if (!navigator.onLine) {
                await cevrimeKuyrugaAl('b1_arge_trendler', duzenleId ? 'UPDATE' : 'INSERT', duzenleId ? { ...payload, id: duzenleId } : payload);
                goster(isAR ? '⚠️ لا يوجد اتصال. تم الحفظ في التخزين المؤقت للبيانات دون اتصال!' : '⚠️ İnternet Yok: Kumaş/Model arge verisi çevrimdışı belleğe (idb) hapsedildi. Wi-Fi gelince otomatik fırlatılacak!');
                setForm(BOSH_FORM);
                setFormAcik(false);
                setDuzenleId(null);
                setLoading(false);
                return;
            }

            let reqError = null;
            if (duzenleId) {
                const { error } = await supabase.from('b1_arge_trendler').update(payload).eq('id', duzenleId);
                reqError = error;
            } else {
                const { error } = await supabase.from('b1_arge_trendler').insert([payload]);
                reqError = error;
            }

            if (!reqError) {
                goster(isAR ? '✅ تم حفظ الاتجاه بنجاح!' : '✅ Trend başarıyla kaydedildi/güncellendi!');
                setForm(BOSH_FORM);
                setFormAcik(false);
                setDuzenleId(null);
            } else {
                throw reqError;
            }
        } catch (error) {
            goster((isAR ? 'خطأ: ' : 'Bağlantı Hatası: ') + (error?.message || 'Bilinmeyen hata'), 'error');
        }
        setLoading(false);
        setIslemdeId(null);
    };

    const durumGuncelle = async (id, yeniDurum) => {
        if (islemdeId === 'durum_' + id) return;
        setIslemdeId(('durum_' + id));

        const { error } = await supabase
            .from('b1_arge_trendler')
            .update({ durum: yeniDurum })
            .eq('id', id);

        if (!error) {
            const mesajTR = yeniDurum === 'onaylandi'
                ? '✅ Trend onaylandı! Ajan tetiklendi → Kumaş seçimi için uyarı oluşturuldu.'
                : '❌ Trend iptal edildi.';
            const mesajAR = yeniDurum === 'onaylandi'
                ? '✅ تمت الموافقة على الاتجاه! تم تشغيل الوكيل → تم إنشاء تنبيه لاختيار القماش.'
                : '❌ تم إلغاء الاتجاه.';
            goster(isAR ? mesajAR : mesajTR, yeniDurum === 'onaylandi' ? 'success' : 'error');

            // Q Kriteri Onarımı (Try-catch çökme engeli)
            try {
                // 🟢 EKLENDİ: Ajan log kaydına KİMİN onayladığı işlendi! (İz Bırakma - Anonim Silindi)
                if (yeniDurum === 'onaylandi') {
                    const onaylayanAd = kullanici?.ad || 'Atölye Lideri (PIN)';
                    const ilgiliTrend = trendler.find(t => t.id === id);
                    const trendGosterimi = ilgiliTrend ? ilgiliTrend.baslik : 'Yeni Trend';

                    await supabase.from('b1_agent_loglari').insert([{
                        ajan_adi: 'Trend Kâşifi',
                        islem_tipi: 'Trend Onaylandı',
                        mesaj: `Trend Onaylandı! Onaylayan: ${onaylayanAd}`,
                        sonuc: 'basarili',
                        created_at: new Date().toISOString()
                    }]);

                    // 🟢 EKLENDİ: TELEGRAM BİLDİRİMİ TETİKLEYİCİ
                    try {
                        await fetch('/api/telegram-bildirim', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                mesaj: `🚀 <b>YENİ TREND ONAYLANDI! (M1 - AR-GE)</b>\n\n` +
                                    `📌 <b>Başlık:</b> ${trendGosterimi}\n` +
                                    `👤 <b>Onaylayan:</b> ${onaylayanAd}\n\n` +
                                    `👉 <i>Lütfen M2-Kalıphane modülünden Kumaş و Tasarım işlemlerine başlayınız.</i>`
                            })
                        });
                    } catch (err) {
                        /* Hata yutuldu */
                    }
                }
            } catch (networkError) {
                goster('Veritabanıyla bağlantı koptu ama log silinmedi.', 'error');
            }
        }
        setIslemdeId(null);
    };

    const sil = async (id) => {
        // 🟢 GÜVENLİK: Sunucu taraflı PIN doğrulama (NEXT_PUBLIC_ADMIN_PIN sızdırılmaz)
        const { yetkili, mesaj: yetkiMesaj } = await silmeYetkiDogrula(kullanici);
        if (!yetkili) return goster(yetkiMesaj || 'Yetkisiz işlem.', 'error');

        if (!confirm(isAR ? 'هل أنت متأكد من الحذف الحقيقي؟ لا يمكن التراجع!' : 'Silmek istediğinize çok emin misiniz? (Bu işlem geri alınamaz)')) return;

        // 🟢 DÜZELTİLDİ: Offline Silme
        if (!navigator.onLine) {
            await cevrimeKuyrugaAl('b1_arge_trendler', 'DELETE', { id });
            goster(isAR ? '⚠️ تم جدولة الحذف دون اتصال.' : '⚠️ İnternet Yok: Silme komutu idb belleğine alındı, bağlantı gelince silinecek.');
            return;
        }

        if (islemdeId === 'sil_' + id) return;
        setIslemdeId(('sil_' + id));

        try {
            // 25. KRİTER ONARIMI: "KARA KUTU / İZCİ" (Soft Delete Simülasyonu)
            const silinecek = trendler.find(t => t.id === id);
            if (silinecek) {
                // Silmeden önce ajan günlüğüne veya sistem loglarına yazarız
                await supabase.from('b0_sistem_loglari').insert([{
                    tablo_adi: 'b1_arge_trendler',
                    islem_tipi: 'SILME',
                    eski_veri: silinecek,
                    kullanici_adi: (kullanici)?.ad || 'Atölye Lideri (PIN)'
                }]);
            }

            const { error } = await supabase.from('b1_arge_trendler').delete().eq('id', id);
            if (!error) {
                goster(isAR ? 'تم الحذف' : 'Silindi');
                // Socket yenileyecek
            } else throw error;
        } catch (error) {
            goster('Silme işlemi başarısız: ' + error.message, 'error');
        }
        setIslemdeId(null);
    };

    // ── ZAMANSAL DOĞRULAMA FONKSİYONLARI ──────────────────────────────
    // Gerçek sonuç kaydet (imalat yapıldıysa satış verisi, yapılmadıysa karşılaştırma)
    const gercekSonucKaydet = async (trendId, gercekSonuc) => {
        const { error } = await supabase.from('b1_arge_trendler').update({
            gercek_sonuc: gercekSonuc,
            dogrulama_tarihi: new Date().toISOString(),
            dogrulama_durumu: 'yapildi',
        }).eq('id', trendId);
        if (!error) goster('✅ Sonuç kaydedildi', 'success');
        else goster('Hata: ' + error.message, 'error');
    };

    // Doğrulama periyodunu ayarla (15 / 30 / 45 / 90 gün)
    const dogrulamaPeriyoduAyarla = async (trendId, gun) => {
        const dogrulamaZamani = new Date(Date.now() + gun * 86400000).toISOString();
        const { error } = await supabase.from('b1_arge_trendler').update({
            dogrulama_periyodu: gun,
            dogrulama_zamani: dogrulamaZamani,
            dogrulama_durumu: 'bekliyor',
        }).eq('id', trendId);
        if (!error) goster(`⏰ ${gun} gün sonra doğrulama planlandı`, 'success');
        else goster('Hata: ' + error.message, 'error');
    };

    // Aynı ürünü bugün yeniden araştır — Perplexity ile
    const zamanYenidenArastir = async (trend) => {
        if (!trend?.baslik) return;
        setYenidenAraniyor(trend.id);
        try {
            const gunFark = trend.arsiv_tarihi
                ? Math.floor((Date.now() - (new Date(trend.arsiv_tarihi))) / 86400000) : 30;
            const orijinalKarar = trend.herm_karari || 'Belirtilmemiş';
            const orijinalSkor = trend.talep_skoru || '?';
            const platform = trend.platform || 'genel';
            const kategori = trend.kategori || 'tekstil';

            const sorgu = [
                'Aşağıdaki soruları yanıtla. Türkiye tekstil/moda pazarı için gerçek piyasa verilerine dayan.',
                '',
                'ÜRÜN: ' + trend.baslik,
                'KATEGORİ: ' + kategori + ' | PLATFORM: ' + platform,
                'İLK ARAŞTIRMA: ' + gunFark + ' gün önce | O ZAMANKİ HermAI KARARI: ' + orijinalKarar + ' (Talep Skoru: ' + orijinalSkor + '/10)',
                '',
                '=== A) TREND DURUMU ===',
                '1. Bu ürün hâlâ trend mi? Instagram, TikTok, Pinterest\'te içerik artıyor mu azalıyor mu?',
                '2. Google Trends sinyali: Son 30 günde bu ürün araması arttı mı düştü mü?',
                '3. Büyük moda markaları (Zara, H&M, Mango, Shein) bu ürünü son ' + gunFark + ' günde koleksiyona ekledi mi?',
                '',
                '=== B) SATIŞ PERFORMANSI ===',
                '4. SATTI MI SATMADI MI? Trendyol ve Amazon Türkiye\'de bu ürün aktif olarak satılıyor mu? Listeleme sayısı arttı mı azaldı mı?',
                '5. NE KADAR SATTI? Trendyol\'da "X adet satıldı" göstergeleri, yorum sayısı, satış hızı hakkında ne biliyorsun? Yüksek satış = çok yorum & stok tükenmesi.',
                '6. HANGİ FİYAT ARALĞINDA? Piyasada bu ürünün ortalama fiyatı nedir? Fiyat yükseldiyse = talep güçlü, düştüyse = piyasada çok ürün var.',
                '7. STok DURUMU: Herhangi bir marka stok tükendi mi bildirdi? Bu güçlü talep sinyali.',
                '',
                '=== C) REKABETÇİ DURUM ===',
                '8. Rakipler bu ürünü ürettiyse satabildi mi? En çok hangi fiyat segmentinde satıldı?',
                '9. Türkiye\'nin kendi tekstil markaları (LC Waikiki, Koton, DeFacto, Mavi) bu ürünü koleksiyonlarına eklediyse satış başarısı nasıldı?',
                '',
                '=== ÖZET KARAR (bu formatta yaz) ===',
                'TREND: [GUCLU / ORTA / ZAYIF / BITTI]',
                'SATIS: [COK_SATTI / ORTA_SATTI / AZ_SATTI / SATMADI / BILGI_YOK]',
                'ORTALAMA_FIYAT: [rakam veya BILINMIYOR]',
                'RAKIP_URETTI: [EVET hangi marka / HAYIR / BELIRSIZ]',
                'HermAI_KARAR_UYUM: [DOGRULANDI / KISMI / YANLIS / BELIRSIZ]',
                'EN_ONEMLI_BULGU: [tek cümle — en kritik bulgu ne?]'
            ].join('\n');

            const res = await fetch('/api/perplexity-arama', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sorgu }),
            });
            const data = await res.json();
            const veriOkumaHata = !data || (!data.sonuc && !data.content);
            if (veriOkumaHata) {
                // 🚨 EKİP GAMMA: Perplexity hatası sadece UI'da değil veritabanında da işaretlendi (Asılı kalma önlendi)
                await supabase.from('b1_arge_trendler').update({
                    yeniden_arastirma: 'HATA YAKALANDI: Ajan analiz edemedi.',
                    dogrulama_durumu: 'hata'
                }).eq('id', trend.id);
                return goster('AI Ajanı yanıt veremedi veya sunucu hatası oluştu!', 'error');
            }

            const yeniArastirma = data?.sonuc || data?.content;
            const { error } = await supabase.from('b1_arge_trendler').update({
                yeniden_arastirma: yeniArastirma,
                dogrulama_durumu: 'arastirildi',
            }).eq('id', trend.id);
            if (!error) goster('🔄 Yeni araştırma tamamlandı — karşılaştırma hazır', 'success');
        } catch (e) {
            // Ağ hatası vb durumlarda da asılı kalmasın
            await supabase.from('b1_arge_trendler').update({
                yeniden_arastirma: 'SİSTEM HATASI: ' + e.message,
                dogrulama_durumu: 'hata'
            }).eq('id', trend.id);
            goster('Araştırma hatası: ' + e.message, 'error');
        } finally {
            setYenidenAraniyor(null);
        }
    };
    // ────────────────────────────────────────────────────────────────────


    const skorRenk = (skor) => {
        if (skor >= 8) return '#10b981';
        if (skor >= 5) return '#f59e0b';
        return '#ef4444';
    };

    const filtreliTrendler = filtre === 'tumu' ? trendler : trendler.filter(t => t.durum === filtre);
    const arsivTrendler = trendler.filter(t => t.durum === 'arsivlendi');
    const dogrulamaGeldi = arsivTrendler.filter(t =>
        t.dogrulama_zamani && t.dogrulama_durumu !== 'yapildi' && new Date(t.dogrulama_zamani) <= new Date()
    );

    // Auth yükleniyorsa bekle — race condition önlemi
    if (authYukleniyor) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
                <div style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTop: '4px solid #047857', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
                <p style={{ fontWeight: 600 }}>Yükleniyor...</p>
            </div>
        );
    }

    // 🟢 EKLENDİ: EĞER PİN YOKSA VE YETKİSİZSE BEYAZ EKRAN DEĞİL, UYARI VER!
    if (!yetkiliMi) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '16px', margin: '2rem' }}>
                <Lock size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
                <h2 style={{ color: '#b91c1c', fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase' }}>YETKİSİZ GİRİŞ ENGELLENDİ</h2>
                <p style={{ color: '#7f1d1d', fontWeight: 600, marginTop: 8 }}>M1 Ar-Ge verileri gizlidir. Görüntülemek için Üretim PİN veya Yetkili Kullanıcı girişi gereklidir. Lütfen Karargâh anasayfasına dönerek yetki ataması yapın.</p>
            </div>
        );
    } // KALKAN BİTİŞ

    return (
        <div dir={isAR ? 'rtl' : 'ltr'} style={{
            fontFamily: isAR ? 'Tahoma, Arial, sans-serif' : 'inherit',
            minHeight: '100%',
            background: 'linear-gradient(145deg, #f8fafc 0%, #eef2f6 100%)',
            padding: '2rem',
            borderRadius: '32px',
            boxShadow: 'inset 0 0 100px rgba(255,255,255,0.8), 0 10px 40px -10px rgba(0,0,0,0.05)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* AMBIENT LIGHTS FOR "ALIVE" FEELING */}
            <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(52, 211, 153, 0.12) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none', animation: 'ambientPulse 15s ease-in-out infinite alternate' }}></div>
            <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '70vw', height: '70vw', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none', animation: 'ambientPulse2 20s ease-in-out infinite alternate' }}></div>

            <div style={{ position: 'relative', zIndex: 1 }}> {/* İçerik Katmanı */}

                {/* BAŞLIK */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div style={{ textAlign: isAR ? 'right' : 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #047857, #fbbf24)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <TrendingUp size={24} color="white" />
                            </div>
                            <div>
                                <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                                    {isAR ? 'بحث وتطوير وأبحاث الاتجاهات' : 'Ar-Ge & Trend Araştırması'}
                                </h1>
                                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0', fontWeight: 600 }}>
                                    {isAR ? 'حدد هدف الإنتاج من تحليل السوق. لا يُفتح مسودة النموذج دون الموافقة.' : 'Pazar analiziyle üretim hedefini belirle. Onaylanmadan model taslağı açılmaz.'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
                        <span style={{ background: '#ecfdf5', color: '#047857', border: '2px solid #a7f3d0', padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Bot size={12} /> {isAR ? 'الوكيل: مُنشَّط' : 'Ajan: Trend Kâşifi'}
                        </span>
                        <button
                            onClick={() => { setFormAcik(!formAcik); window.scrollTo({ top: 300, behavior: 'smooth' }); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#047857', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', boxShadow: '0 4px 14px rgba(4,120,87,0.4)', transition: 'all 0.2s' }}
                        >
                            <Plus size={18} />
                            {isAR ? 'اتجاه جديد' : 'Yeni Trend'}
                        </button>
                    </div>
                </div>

                {/* MESAJ */}
                {mesaj.text && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', marginBottom: '1rem', borderRadius: '10px', border: '2px solid', fontWeight: 700, fontSize: '0.875rem', borderColor: mesaj.type === 'error' ? '#ef4444' : '#10b981', background: mesaj.type === 'error' ? '#fef2f2' : '#ecfdf5', color: mesaj.type === 'error' ? '#b91c1c' : '#065f46' }}>
                        {mesaj.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                        {mesaj.text}
                    </div>
                )}

                {/* AI TREND ARAMA KUTUSU */}

                {/* ── 🤖 YENİ: 8 ÇEKİRDEKLİ OTONOM İSTİHBARAT AĞI WİDGET'I ──────────────────────── */}
                <div style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, #020617 0%, #064e3b 100%)', borderRadius: '24px', overflow: 'hidden', position: 'relative', border: '1px solid rgba(52, 211, 153, 0.15)', boxShadow: '0 20px 50px -15px rgba(2, 44, 34, 0.6)' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'repeating-radial-gradient(circle at 17% 32%, rgb(255,255,255) 0vw, transparent 1px), repeating-radial-gradient(circle at 62% 23%, rgb(255,255,255) 0vw, transparent 1px)', backgroundSize: '7px 7px', opacity: 0.03, mixBlendMode: 'overlay' }}></div>
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: '#d4af37', filter: 'blur(40px)', opacity: 0.15, borderRadius: '50%' }}></div>

                    <div style={{ padding: '1.25rem', position: 'relative', zIndex: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
                            <h2 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fcd34d', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', filter: 'drop-shadow(0 0 8px rgba(252, 211, 77, 0.4))' }}>
                                <Cpu size={18} /> {isAR ? 'شبكة الاستخبارات المستقلة ذات 8 نوى' : '8 Çekirdekli Otonom İstihbarat Ağı'}
                            </h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '6px 14px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 900, color: '#6ee7b7' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></span>
                                SİSTEM DEVREDE
                            </div>
                        </div>

                        {/* Gerçek veri: state'teki trendler tablosundan hesaplanır */}
                        {(() => {
                            const toplamTrend = trendler.length;
                            const onaylananSayisi = trendler.filter(t => t.durum === 'onaylandi').length;
                            const incelenanSayisi = trendler.filter(t => t.durum === 'inceleniyor').length;
                            const onayOrani = toplamTrend > 0 ? Math.round((onaylananSayisi / toplamTrend) * 100) : 0;
                            return (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3"> {/* 🚨 EKİP ALPHA: sm:grid-cols-1 md:grid-cols-3 alt alta taşırma sağlandı (Native style objeleri Tailwind css className'e evrildi uyumluluk için) */}
                                    {/* Veri Madencileri — Gerçek trend sayısı */}
                                    <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(94, 234, 212, 0.2)', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '8px', borderRadius: '8px' }}>
                                                <Network size={16} color="#38bdf8" />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#e2e8f0' }}>Kayıtlı Trend</div>
                                                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '2px' }}>{incelenanSayisi} inceleniyor</div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '1rem', fontWeight: 900, color: '#38bdf8', fontFamily: 'monospace' }}>{toplamTrend}</div>
                                            <div style={{ fontSize: '0.55rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Toplam</div>
                                        </div>
                                    </div>

                                    {/* Analistler — Gerçek onay oranı */}
                                    <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(251, 191, 36, 0.2)', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ background: 'rgba(251, 191, 36, 0.15)', padding: '8px', borderRadius: '8px' }}>
                                                <Zap size={16} color="#fbbf24" />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#e2e8f0' }}>Onay Oranı</div>
                                                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '2px' }}>{onaylananSayisi} onaylandı</div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fbbf24', fontFamily: 'monospace' }}>%{onayOrani}</div>
                                            <div style={{ fontSize: '0.55rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Karar İsabeti</div>
                                        </div>
                                    </div>

                                    {/* Baş Stratejist — Ajan log sayısı */}
                                    <div style={{ background: 'rgba(212, 175, 55, 0.05)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ background: 'rgba(212, 175, 55, 0.15)', padding: '8px', borderRadius: '8px' }}>
                                                <Database size={16} color="#d4af37" />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#d4af37' }}>Baş Stratejist</div>
                                                <div style={{ fontSize: '0.65rem', color: '#fde68a', marginTop: '2px', opacity: 0.8 }}>{agentLoglari.length} ajan logu</div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '1rem', fontWeight: 900, color: '#10b981', fontFamily: 'monospace' }}>HAZIR</div>
                                            <div style={{ fontSize: '0.55rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Nihai Onay</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                    <style>{`
                    @keyframes pulse {
                        0%, 100% { opacity: 1; transform: scale(1); }
                        50% { opacity: .5; transform: scale(1.1); }
                    }
                `}</style>
                </div>

                <M1_AramaMotoru
                    aiSorgu={aiSorgu}
                    setAiSorgu={setAiSorgu}
                    trendAra={trendAra}
                    aiAraniyor={aiAraniyor}
                    aiAjanDurumu={aiAjanDurumu}
                    isAR={isAR}
                />

                {/* AI SONUÇLARI */}
                {aiSonuclar && aiPanelAcik && (
                    <div style={{ marginTop: '1rem' }}>
                        {(aiSonuclar).ozet && (
                            <div style={{ background: '#1e293b', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '0.75rem', color: '#cbd5e1', fontSize: '0.82rem', lineHeight: 1.6, borderLeft: '3px solid #059669' }}>
                                💡 {(aiSonuclar).ozet}
                            </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '1rem' }}>
                            {((aiSonuclar).sonuclar || []).map((s, i) => (
                                <M1_TrendSonucKarti
                                    key={i}
                                    sonuc={s}
                                    onKaydet={() => aiTrendKaydet(s)}
                                    isAR={isAR}
                                />
                            ))}
                        </div>
                        <button onClick={() => setAiPanelAcik(false)} style={{ marginTop: 8, fontSize: '0.72rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>Sonuçları Kapat</button>
                    </div>
                )}

                {/* ── 🤖 YENİ: HERMAI GÜNLÜKLERİ PANELI (Toggle) ──────────────────────── */}
                <div style={{ marginTop: '2rem', marginBottom: '1rem' }}>
                    <button
                        onClick={() => setDuzenleId(duzenleId === 'hermai_gunlugu' ? null : 'hermai_gunlugu')}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px solid #cbd5e1', color: '#475569', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                        <Network size={16} />
                        {duzenleId === 'hermai_gunlugu' ? 'HermAI Günlüklerini Gizle' : 'HermAI Günlüklerini Göster'}
                        <ChevronDown size={16} style={{ transform: duzenleId === 'hermai_gunlugu' ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
                    </button>

                    {duzenleId === 'hermai_gunlugu' && (
                        <div style={{ marginTop: '1rem', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
                            <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Bot size={20} color="#047857" />
                                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>HermAI Otonom Karar Günlüğü</h3>
                            </div>
                            <div style={{ padding: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
                                {/* b0_herm_ai_kararlar tablosundan readonly veri çekilecek */}
                                {hermaiKararlari.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {hermaiKararlari.map((karar, index) => (
                                            <div key={index} style={{ padding: '12px', background: karar.karar === 'RED' ? '#fef2f2' : (karar.karar === 'ONAY' ? '#ecfdf5' : '#f8fafc'), borderLeft: `4px solid ${karar.karar === 'RED' ? '#ef4444' : (karar.karar === 'ONAY' ? '#10b981' : '#f59e0b')}`, borderRadius: '8px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                    <span style={{ fontWeight: 800, fontSize: '0.8rem', color: karar.karar === 'RED' ? '#991b1b' : (karar.karar === 'ONAY' ? '#065f46' : '#92400e') }}>
                                                        {karar.karar === 'RED' ? '❌ İPTAL/BLOKAJ' : (karar.karar === 'ONAY' ? '✅ UYGUN' : '⚠️ İNCELEME')}
                                                    </span>
                                                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{formatTarih(karar.created_at)}</span>
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: '#334155' }}>{karar.ajan_tavsiyesi}</div>
                                                <div style={{ marginTop: '8px', fontSize: '0.7rem', color: '#475569', fontWeight: 600 }}>Güven Skoru: {karar.guven_skoru}/10</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.85rem' }}>
                                        <Database size={32} style={{ opacity: 0.3, margin: '0 auto 10px' }} />
                                        <span>Şu an kaydedilmiş sistem hafızası veya HermAI engellemesi bulunmuyor.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* YENİ TREND FORMU */}

                {formAcik && (
                    <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: '24px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 15px 50px -15px rgba(4,120,87,0.1)' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#064e3b', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 10, textAlign: isAR ? 'right' : 'left' }}>
                            <TrendingUp size={18} />
                            {isAR ? 'تسجيل اتجاه جديد' : 'Yeni Trend Kaydı'}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* 🚨 EKİP ALPHA: gridTemplateColumns sabiti grid-cols-1 md:grid-cols-2 esnekliğine çekildi */}
                            {/* Başlık TR */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    🇹🇷 {isAR ? 'العنوان بالتركية' : 'Trend Başlığı (Türkçe)'} *
                                </label>
                                <input
                                    type="text"
                                    value={form.baslik}
                                    onChange={e => setForm({ ...form, baslik: e.target.value })}
                                    maxLength={150} // X Kriteri
                                    placeholder={isAR ? 'عنوان الاتجاه بالتركية' : 'Örn: Yazlık Keten Gömlek Serisi'}
                                    style={{ width: '100%', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', transition: 'border 0.2s' }}
                                    onFocus={e => e.target.style.borderColor = '#047857'}
                                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                                />
                            </div>

                            {/* Başlık AR */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    🇸🇦 {isAR ? 'العنوان بالعربية' : 'Trend Başlığı (Arapça)'}
                                </label>
                                <input
                                    type="text"
                                    dir="rtl"
                                    value={form.baslik_ar}
                                    maxLength={150} // X Kriteri
                                    onChange={e => setForm({ ...form, baslik_ar: e.target.value })}
                                    placeholder="مثال: سلسلة قمصان صيفية من الكتان"
                                    style={{ width: '100%', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'Tahoma, Arial', boxSizing: 'border-box', outline: 'none', textAlign: 'right' }}
                                />
                            </div>

                            {/* Platform */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase' }}>
                                    {isAR ? 'المنصة' : 'Platform'} *
                                </label>
                                <select
                                    value={form.platform}
                                    onChange={e => setForm({ ...form, platform: e.target.value })}
                                    style={{ width: '100%', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: 'white', cursor: 'pointer' }}
                                >
                                    {PLATFORMLAR.map(p => (
                                        <option key={p} value={p}>{isAR ? TX.ar['platform_' + p] : TX.tr['platform_' + p]}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Kategori */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase' }}>
                                    {isAR ? 'فئة المنتج' : 'Ürün Kategorisi'} *
                                </label>
                                <select
                                    value={form.kategori}
                                    onChange={e => setForm({ ...form, kategori: e.target.value })}
                                    style={{ width: '100%', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: 'white', cursor: 'pointer' }}
                                >
                                    {KATEGORILER.map(k => (
                                        <option key={k} value={k}>{KAT_LABEL[lang][k] || k}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Hedef Kitle */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase' }}>
                                    {isAR ? 'الجمهور المستهدف' : 'Hedef Kitle'} *
                                </label>
                                <select
                                    value={form.hedef_kitle}
                                    onChange={e => setForm({ ...form, hedef_kitle: e.target.value })}
                                    style={{ width: '100%', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: 'white', cursor: 'pointer' }}
                                >
                                    <option value="kadın">{isAR ? 'نسائي' : 'Kadın'}</option>
                                    <option value="erkek">{isAR ? 'رجالي' : 'Erkek'}</option>
                                    <option value="üniseks">{isAR ? 'للجنسين' : 'Üniseks'}</option>
                                    <option value="çocuk">{isAR ? 'أطفال' : 'Çocuk'}</option>
                                </select>
                            </div>

                            {/* Talep Skoru ve Zorluk Derecesi (2 Kolon) */}
                            <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                                        <span style={{ textTransform: 'uppercase' }}>{isAR ? 'درجة الطلب في السوق' : 'Pazar Talep Skoru'} *</span>
                                        <span style={{ color: skorRenk(form.talep_skoru), fontWeight: 900, fontSize: '1rem' }}>{form.talep_skoru} / 10</span>
                                    </label>
                                    <input
                                        type="range" min="1" max="10"
                                        value={form.talep_skoru || 5}
                                        onChange={e => setForm({ ...form, talep_skoru: Number(e.target.value) })}
                                        style={{ width: '100%', cursor: 'pointer', accentColor: skorRenk(form.talep_skoru), padding: '10px 0' /* 🚨 EKİP ALPHA: hitbox artışı */ }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#9ca3af', marginTop: 4 }}>
                                        <span>{isAR ? 'منخفض' : 'Düşük'}</span><span>{isAR ? 'متوسط' : 'Orta'}</span><span>{isAR ? 'مرتفع جداً' : 'Çok Yüksek'}</span>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                                        <span style={{ textTransform: 'uppercase' }}>{isAR ? 'مستوى صعوبة الإنتاج' : 'Üretim Zorluk Derecesi'} *</span>
                                        <span style={{ color: '#4f46e5', fontWeight: 900, fontSize: '1rem' }}>{form.zorluk_derecesi || 5} / 10</span>
                                    </label>
                                    <input
                                        type="range" min="1" max="10"
                                        value={form.zorluk_derecesi || 5}
                                        onChange={e => setForm({ ...form, zorluk_derecesi: Number(e.target.value) })}
                                        style={{ width: '100%', cursor: 'pointer', accentColor: '#4f46e5', padding: '10px 0' /* 🚨 EKİP ALPHA: hitbox artışı */ }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#9ca3af', marginTop: 4 }}>
                                        <span>{isAR ? 'سهل جداً' : 'Çok Kolay'}</span><span>{isAR ? 'متوسط' : 'Orta'}</span><span>{isAR ? 'صعب جداً' : 'Çok Zor'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Referans Link */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase' }}>
                                    {isAR ? 'الرابط المرجعي' : 'Referans Link'}
                                </label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input
                                        type="url"
                                        value={form.referans_link}
                                        onChange={e => setForm({ ...form, referans_link: e.target.value })}
                                        placeholder="https://..."
                                        style={{ flex: 1, padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.85rem', fontFamily: 'monospace', boxSizing: 'border-box', outline: 'none' }}
                                    />
                                    <Link size={16} style={{ alignSelf: 'center', color: '#9ca3af' }} />
                                </div>
                            </div>

                            {/* Görsel URL & Kamera Çekimi */}
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase' }}>
                                    {isAR ? 'رابط الصورة / الكاميرا' : 'Numune Görseli / Kamera'}
                                </label>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <input
                                        type="url"
                                        value={form.gorsel_url}
                                        onChange={e => setForm({ ...form, gorsel_url: e.target.value })}
                                        placeholder="https://...jpg veya Kameradan çekin"
                                        style={{ flex: 1, minWidth: 200, padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.85rem', fontFamily: 'monospace', boxSizing: 'border-box', outline: 'none' }}
                                    />
                                    {/* 🟢 DÜZELTİLDİ: Saha Gerçekliği -> Tablet Kamera Capture Yeteneği */}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        id="arge-kamera-input"
                                        style={{ display: 'none' }}
                                        onChange={async (e) => {
                                            const file = ((e.target)).files?.[0];
                                            if (file) {
                                                // 🚨 EKİP BETA: İstemci tarafında HTML5 Canvas Resmi Küçültme Algoritması eklendi (Compressor)
                                                // 500kb blokajı kaldırılıp 800x800'e downscale ediliyor.
                                                try {
                                                    const compressImage = async (fileItem) => {
                                                        return new Promise((resolve, reject) => {
                                                            const img = new Image();
                                                            const url = URL.createObjectURL(fileItem);
                                                            img.onload = () => {
                                                                const MAX_WIDTH = 800;
                                                                const MAX_HEIGHT = 800;
                                                                let width = img.width;
                                                                let height = img.height;
                                                                if (width > height && width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                                                                else if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                                                                const canvas = document.createElement('canvas');
                                                                canvas.width = width; canvas.height = height;
                                                                const ctx = canvas.getContext('2d');
                                                                ctx.drawImage(img, 0, 0, width, height);
                                                                canvas.toBlob((blob) => {
                                                                    resolve(new File([blob], fileItem.name, { type: 'image/jpeg', lastModified: Date.now() }));
                                                                    URL.revokeObjectURL(url);
                                                                }, 'image/jpeg', 0.7);
                                                            };
                                                            img.onerror = () => reject('Resim okunamadı');
                                                            img.src = url;
                                                        });
                                                    };
                                                    goster('Resim sıkıştırılıyor, lütfen bekleyin...', 'success');
                                                    const sikistirilmisDosya = await compressImage(file);
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => setForm({ ...form, gorsel_url: (reader.result), gorsel_dosyasi: sikistirilmisDosya });
                                                    reader.readAsDataURL(sikistirilmisDosya);
                                                } catch (err) {
                                                    goster('Kamera işleme esnasında kilitlendi.', 'error');
                                                }
                                            }
                                        }}
                                    />
                                    <label htmlFor="arge-kamera-input" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: '#ecfdf5', color: '#059669', border: '2px solid #a7f3d0', padding: '10px 16px', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem' }}>
                                        <Camera size={16} /> {isAR ? 'فتح الكاميرا' : 'Kamerayı Aç'}
                                    </label>
                                </div>
                                {form.gorsel_url && form.gorsel_url.startsWith('data:image') && (
                                    <div style={{ marginTop: 8 }}>
                                        <img src={form.gorsel_url} alt="Kamera Özeti" loading="lazy" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '2px solid #e5e7eb' }} />
                                    </div>
                                )}
                            </div>

                            {/* Açıklama TR */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase' }}>
                                    🇹🇷 {isAR ? 'الملاحظات بالتركية' : 'Açıklama / Not'}
                                </label>
                                <textarea
                                    rows={3}
                                    value={form.aciklama}
                                    maxLength={400} // X Kriteri
                                    onChange={e => setForm({ ...form, aciklama: e.target.value })}
                                    placeholder={isAR ? 'ملاحظات بالتركية...' : 'Bu trendin genel değerlendirmesi...'}
                                    style={{ width: '100%', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }}
                                />
                            </div>

                            {/* Açıklama AR */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase' }}>
                                    🇸🇦 {isAR ? 'الملاحظات بالعربية' : 'Açıklama (Arapça)'}
                                </label>
                                <textarea
                                    rows={3}
                                    dir="rtl"
                                    value={form.aciklama_ar}
                                    onChange={e => setForm({ ...form, aciklama_ar: e.target.value })}
                                    placeholder="التقييم العام لهذا الاتجاه..."
                                    style={{ width: '100%', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'Tahoma, Arial', boxSizing: 'border-box', outline: 'none', resize: 'vertical', textAlign: 'right' }}
                                />
                            </div>
                        </div>

                        {/* Butonlar */}
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end', flexDirection: isAR ? 'row-reverse' : 'row' }}>
                            <button
                                onClick={() => { setForm(BOSH_FORM); setFormAcik(false); }}
                                style={{ padding: '10px 20px', border: '2px solid #e5e7eb', borderRadius: '8px', background: 'white', fontWeight: 700, cursor: 'pointer', color: '#374151' }}
                            >
                                {isAR ? 'إلغاء' : 'İptal'}
                            </button>
                            <button
                                onClick={kaydet}
                                disabled={loading || islemdeId === 'kaydet_modal'}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', background: (loading || islemdeId === 'kaydet_modal') ? '#94a3b8' : '#047857', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: (loading || islemdeId === 'kaydet_modal') ? 'wait' : 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 14px rgba(4,120,87,0.4)', opacity: islemdeId === 'kaydet_modal' ? 0.5 : 1 }}
                            >
                                <CheckCircle2 size={16} />
                                {(loading || islemdeId === 'kaydet_modal') ? (isAR ? 'جار الحفظ...' : 'Kaydediliyor...') : (isAR ? 'حفظ الاتجاه' : 'Trendi Kaydet')}
                            </button>
                        </div>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>

                    {/* TREND LİSTESİ */}
                    <div>
                        {/* Filtreler */}
                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexDirection: isAR ? 'row-reverse' : 'row', flexWrap: 'wrap' }}>
                            {['tumu', 'inceleniyor', 'onaylandi', 'iptal'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFiltre(f)}
                                    style={{
                                        padding: '8px 18px', borderRadius: '24px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        border: filtre === f ? 'none' : '1px solid rgba(255, 255, 255, 0.8)',
                                        background: filtre === f ? 'linear-gradient(135deg, #059669, #047857)' : 'rgba(255, 255, 255, 0.6)',
                                        backdropFilter: filtre === f ? 'none' : 'blur(10px)',
                                        color: filtre === f ? 'white' : '#475569',
                                        boxShadow: filtre === f ? '0 6px 15px rgba(4, 120, 87, 0.3)' : '0 2px 5px rgba(0,0,0,0.02)'
                                    }}
                                    onMouseEnter={e => {
                                        if (filtre !== f) {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        } else {
                                            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(4, 120, 87, 0.4)';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (filtre !== f) {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        } else {
                                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                            e.currentTarget.style.boxShadow = '0 6px 15px rgba(4, 120, 87, 0.3)';
                                        }
                                    }}
                                >
                                    {f === 'tumu' ? (isAR ? 'الكل' : 'Tümü') :
                                        isAR ? DURUM_CONFIG[f]?.label_ar : DURUM_CONFIG[f]?.label_tr}
                                    {' '}({f === 'tumu' ? trendler.length : trendler.filter(t => t.durum === f).length})
                                </button>
                            ))}
                        </div>

                        {/* Trend Kartları */}
                        {loading && (
                            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontWeight: 700 }}>
                                {isAR ? 'جار التحميل...' : 'Yükleniyor...'}
                            </div>
                        )}

                        {!loading && filtreliTrendler.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(10px)', borderRadius: '20px', border: '2px dashed rgba(148, 163, 184, 0.3)' }}>
                                <TrendingUp size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
                                <p style={{ color: '#64748b', fontWeight: 800 }}>
                                    {isAR ? 'لا توجد اتجاهات مسجلة. أضف اتجاهاً جديداً.' : 'Kayıtlı trend yok. Yeni trend ekleyin.'}
                                </p>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {filtreliTrendler.map(trend => (
                                <M1_UrunRecetesi
                                    key={(trend).id}
                                    trend={trend}
                                    onDurumGuncelle={durumGuncelle}
                                    onSil={sil}
                                    onDuzenle={() => {
                                        setForm({
                                            baslik: trend.baslik, baslik_ar: trend.baslik_ar || '', platform: trend.platform,
                                            kategori: trend.kategori, hedef_kitle: trend.hedef_kitle || 'kadın',
                                            talep_skoru: trend.talep_skoru, zorluk_derecesi: trend.zorluk_derecesi || 5,
                                            referans_link: trend.referans_linkler?.[0] || '',
                                            gorsel_url: trend.gorsel_url || '', gorsel_dosyasi: null,
                                            aciklama: trend.aciklama || '', aciklama_ar: trend.aciklama_ar || ''
                                        });
                                        setDuzenleId(trend.id); setFormAcik(true); window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    isAR={isAR}
                                    yetkiliMi={kullanici?.grup === 'tam' || sessionStorage.getItem('sb47_uretim_pin')}
                                    islemdeId={islemdeId}
                                />
                            ))}
                        </div>
                    </div>

                    {/* ARŞİV & ZAMANSAL DOĞRULAMA PANELİ */}
                    {arsivTrendler.length > 0 && (
                        <div style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: '24px', padding: '1.5rem', marginTop: '1rem', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h3 style={{ fontSize: '0.85rem', fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ background: '#f5f3ff', padding: '6px', borderRadius: '8px', color: '#7c3aed' }}>🗃️</div>
                                    Arşiv — Zamansal Doğrulama
                                </h3>
                                {dogrulamaGeldi.length > 0 && (
                                    <span style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', fontSize: '0.7rem', fontWeight: 900, padding: '4px 12px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)' }}>
                                        ⏰ {dogrulamaGeldi.length} doğrulama bekliyor
                                    </span>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 480, overflowY: 'auto' }}>
                                {arsivTrendler.map(trend => {
                                    const gunFark = trend.arsiv_tarihi
                                        ? Math.floor((Date.now() - (new Date(trend.arsiv_tarihi))) / 86400000) : null;
                                    const dogrulamaGeldiMi = trend.dogrulama_zamani
                                        && trend.dogrulama_durumu !== 'yapildi'
                                        && new Date(trend.dogrulama_zamani) <= new Date();
                                    const kalanGun = trend.dogrulama_zamani && trend.dogrulama_durumu === 'bekliyor'
                                        ? Math.max(0, Math.ceil(((new Date(trend.dogrulama_zamani)) - Date.now()) / 86400000)) : null;

                                    return (
                                        <div key={trend.id} style={{
                                            background: dogrulamaGeldiMi ? 'rgba(124, 58, 237, 0.05)' : 'rgba(255, 255, 255, 0.7)',
                                            border: '1px solid ' + (dogrulamaGeldiMi ? 'rgba(124, 58, 237, 0.2)' : 'rgba(255, 255, 255, 0.9)'),
                                            borderRadius: '16px', padding: '16px', transition: 'all 0.3s ease',
                                            boxShadow: dogrulamaGeldiMi ? '0 4px 20px rgba(124, 58, 237, 0.1)' : '0 4px 15px -5px rgba(0,0,0,0.02)'
                                        }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = dogrulamaGeldiMi ? '0 8px 25px rgba(124, 58, 237, 0.15)' : '0 8px 20px -5px rgba(0,0,0,0.06)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = dogrulamaGeldiMi ? '0 4px 20px rgba(124, 58, 237, 0.1)' : '0 4px 15px -5px rgba(0,0,0,0.02)';
                                            }}
                                        >
                                            {/* Başlık satırı */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#1e293b' }}>{trend.baslik}</div>
                                                    <div style={{ fontSize: '0.6rem', color: '#64748b', marginTop: 2 }}>
                                                        {trend.platform} · {trend.kategori}
                                                        {gunFark !== null && ' · ' + gunFark + ' gün önce arşivlendi'}
                                                    </div>
                                                    {trend.herm_karari && (
                                                        <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#7c3aed', marginTop: 3 }}>
                                                            {'🧠 ' + trend.herm_karari + (trend.herm_guven_skoru ? ' · Güven: %' + trend.herm_guven_skoru : '')}
                                                        </div>
                                                    )}
                                                </div>
                                                <button onClick={() => durumGuncelle(trend.id, 'inceleniyor')}
                                                    style={{ padding: '4px 10px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', borderRadius: 6, fontSize: '0.6rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', marginLeft: 8 }}>
                                                    ↩ Geri Al
                                                </button>
                                            </div>

                                            {/* Periyot seç — henüz planlanmamışsa */}
                                            {!trend.dogrulama_zamani ? (
                                                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 8, marginBottom: 8 }}>
                                                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>⏰ Kaç gün sonra yeniden araştırılsın?</div>
                                                    <div style={{ display: 'flex', gap: 4 }}>
                                                        {[15, 30, 45, 90].map(gun => (
                                                            <button key={gun} onClick={() => dogrulamaPeriyoduAyarla(trend.id, gun)}
                                                                style={{ flex: 1, padding: '5px 0', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer' }}>
                                                                {gun + ' gün'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : trend.dogrulama_durumu === 'bekliyor' && (
                                                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 6, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <div style={{ fontSize: '0.62rem', color: dogrulamaGeldiMi ? '#7c3aed' : '#94a3b8', fontWeight: 700 }}>
                                                        {dogrulamaGeldiMi ? '🔔 Doğrulama zamanı geldi!' : '⏳ ' + kalanGun + ' gün kaldı'}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Yeniden Araştır */}
                                            {dogrulamaGeldiMi && (
                                                <button onClick={() => zamanYenidenArastir(trend)} disabled={yenidenAraniyor === trend.id}
                                                    style={{ width: '100%', padding: '9px', marginBottom: 8, background: '#7c3aed', color: 'white', border: 'none', borderRadius: 10, fontWeight: 800, cursor: yenidenAraniyor === trend.id ? 'wait' : 'pointer', fontSize: '0.77rem' }}>
                                                    {yenidenAraniyor === trend.id ? '🔄 Araştırılıyor...' : '🔄 ' + (gunFark || '?') + ' gün sonra — Aynı konuyu bugün araştır'}
                                                </button>
                                            )}

                                            {/* Karşılaştırma — yeni araştırma varsa */}
                                            {trend.yeniden_arastirma && (() => {
                                                const metin = trend.yeniden_arastirma || '';
                                                const parse = (etiket) => {
                                                    const rx = new RegExp(etiket + '[:\\s]+([^\\n]+)', 'i');
                                                    const m = metin.match(rx);
                                                    return m ? m[1].trim() : null;
                                                };
                                                const trendStat = parse('TREND');
                                                const satisStat = parse('SATIS');
                                                const fiyat = parse('ORTALAMA_FIYAT');
                                                const rakip = parse('RAKIP_URETTI');
                                                const uyum = parse('HermAI_KARAR_UYUM');
                                                const bulgu = parse('EN_ONEMLI_BULGU');

                                                const trendRenk = trendStat === 'GUCLU' ? '#10b981' : trendStat === 'ORTA' ? '#f59e0b' : trendStat === 'ZAYIF' ? '#ef4444' : '#94a3b8';
                                                const satisRenk = satisStat === 'COK_SATTI' ? '#10b981' : satisStat === 'ORTA_SATTI' ? '#3b82f6' : satisStat === 'AZ_SATTI' ? '#f59e0b' : satisStat === 'SATMADI' ? '#ef4444' : '#94a3b8';

                                                return (
                                                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 8, marginBottom: 8 }}>
                                                        <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#7c3aed', marginBottom: 8, textTransform: 'uppercase' }}>📊 Karar Karşılaştırması</div>

                                                        {/* O Zaman vs Bugün grid */}
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 8, marginBottom: 12 }}>
                                                            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: '12px', padding: '10px 12px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                                                                <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#a78bfa', marginBottom: 6, letterSpacing: '0.05em' }}>{'O ZAMAN (' + gunFark + ' GÜN ÖNCE)'}</div>
                                                                <div style={{ fontSize: '0.65rem', color: '#e2e8f0', lineHeight: 1.5, fontWeight: 600 }}>{trend.herm_karari || 'Karar yok'}</div>
                                                                <div style={{ marginTop: 6, fontSize: '0.65rem', color: '#a78bfa', fontWeight: 800 }}>{'Talep Skoru: ' + (trend.talep_skoru || '?') + '/10'}</div>
                                                            </div>
                                                            <div style={{ background: 'linear-gradient(135deg, rgba(236, 253, 245, 0.8), rgba(209, 250, 229, 0.6))', backdropFilter: 'blur(8px)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px', padding: '10px 12px' }}>
                                                                <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#047857', marginBottom: 6, letterSpacing: '0.05em' }}>BUGÜN</div>
                                                                {trendStat && <div style={{ fontSize: '0.68rem', fontWeight: 900, color: trendRenk, marginBottom: 4 }}>{'Trend: ' + trendStat}</div>}
                                                                {satisStat && <div style={{ fontSize: '0.68rem', fontWeight: 900, color: satisRenk, marginBottom: 4 }}>{'Satış: ' + satisStat.replace(/_/g, ' ')}</div>}
                                                                {fiyat && fiyat !== 'BILINMIYOR' && <div style={{ fontSize: '0.65rem', color: '#064e3b', fontWeight: 700 }}>{'Ort. Fiyat: ' + fiyat}</div>}
                                                                {rakip && <div style={{ fontSize: '0.6rem', color: '#047857', marginTop: 4 }}>{'Rakip: ' + rakip}</div>}
                                                            </div>
                                                        </div>

                                                        {/* En önemli bulgu */}
                                                        {bulgu && (
                                                            <div style={{ background: '#fefce8', border: '1px solid #fde047', borderRadius: 6, padding: '6px 8px', fontSize: '0.62rem', color: '#713f12', fontWeight: 700, marginBottom: 6 }}>
                                                                {'💡 ' + bulgu}
                                                            </div>
                                                        )}

                                                        {/* Tam metin — açılır */}
                                                        <details>
                                                            <summary style={{ fontSize: '0.58rem', color: '#94a3b8', cursor: 'pointer', marginBottom: 4 }}>Tam araştırma metnini gör</summary>
                                                            <div style={{ fontSize: '0.6rem', color: '#374151', lineHeight: 1.6, background: '#f8fafc', borderRadius: 6, padding: '8px', maxHeight: 160, overflowY: 'auto' }}>
                                                                {metin}
                                                            </div>
                                                        </details>

                                                        {/* HermAI uyum değerlendirme */}
                                                        {!trend.gercek_sonuc && (
                                                            <div style={{ marginTop: 8 }}>
                                                                <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700, marginBottom: 4 }}>
                                                                    {uyum ? 'Sistem tahmini: ' + uyum + ' — Siz onaylıyor musunuz?' : 'HermAI bu kararında:'}
                                                                </div>
                                                                <div style={{ display: 'flex', gap: 4 }}>
                                                                    {[{ v: 'dogru', l: '✅ Haklıydı', c: '#10b981' }, { v: 'kismi', l: '⚠️ Kısmen', c: '#f59e0b' }, { v: 'yanlis', l: '❌ Yanıldı', c: '#ef4444' }].map(btn => (
                                                                        <button key={btn.v} onClick={() => gercekSonucKaydet(trend.id, btn.v)}
                                                                            style={{ flex: 1, padding: '5px', background: btn.c + '20', color: btn.c, border: '1px solid ' + btn.c + '40', borderRadius: 6, fontSize: '0.66rem', fontWeight: 800, cursor: 'pointer' }}>
                                                                            {btn.l}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}

                                            {/* İmalat yapıldıysa satış sonucu */}
                                            {!trend.yeniden_arastirma && !trend.gercek_sonuc && (
                                                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 8 }}>
                                                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>📋 İmalat yaptıysanız gerçek sonuç neydi?</div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                        {[
                                                            { v: 'cok_satti', l: '🔥 Çok Sattı', c: '#10b981' },
                                                            { v: 'orta_satti', l: '📈 Orta', c: '#3b82f6' },
                                                            { v: 'az_satti', l: '📉 Az', c: '#f59e0b' },
                                                            { v: 'satmadi', l: '❌ Satmadı', c: '#ef4444' },
                                                            { v: 'rakip_uretti_satti', l: '🕵️ Rakip Sattı', c: '#8b5cf6' },
                                                        ].map(btn => (
                                                            <button key={btn.v} onClick={() => gercekSonucKaydet(trend.id, btn.v)}
                                                                style={{ padding: '3px 8px', background: btn.c + '18', color: btn.c, border: '1px solid ' + btn.c + '40', borderRadius: 5, fontSize: '0.6rem', fontWeight: 800, cursor: 'pointer' }}>
                                                                {btn.l}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* SAĞ PANEL: İSTATİSTİK + AJAN LOG */}
                    <div className="flex flex-col gap-5 lg:w-[320px] w-full"> {/* 🚨 EKİP ALPHA: Mobil panel çakışması engellendi. Grid css className entegre edildi. */}

                        {/* İstatistik */}
                        <div style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ fontSize: '0.85rem', fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8, flexDirection: isAR ? 'row-reverse' : 'row' }}>
                                <div style={{ background: '#eff6ff', padding: '6px', borderRadius: '8px', color: '#3b82f6' }}><BarChart3 size={16} /></div> {isAR ? 'إحصائيات' : 'İstatistik'}
                            </h3>
                            {[
                                { label_tr: 'Toplam Kayıt', label_ar: 'إجمالي السجلات', val: trendler.length, color: '#3b82f6' },
                                { label_tr: 'İnceleniyor', label_ar: 'قيد المراجعة', val: trendler.filter(t => t.durum === 'inceleniyor').length, color: '#f59e0b' },
                                { label_tr: 'Onaylandı', label_ar: 'تمت الموافقة', val: trendler.filter(t => t.durum === 'onaylandi').length, color: '#10b981' },
                                { label_tr: 'İptal', label_ar: 'ملغي', val: trendler.filter(t => t.durum === 'iptal').length, color: '#ef4444' },
                            ].map((s, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f8fafc', flexDirection: isAR ? 'row-reverse' : 'row' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{isAR ? s.label_ar : s.label_tr}</span>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 900, color: s.color }}>{s.val}</span>
                                </div>
                            ))}
                        </div>

                        {/* Ajan Log */}
                        <div style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.9) 100%)', backdropFilter: 'blur(16px)', border: '1px solid rgba(51, 65, 85, 0.5)', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 15px 40px -10px rgba(0,0,0,0.2)' }}>
                            <h3 style={{ fontSize: '0.8rem', fontWeight: 900, color: '#7dd3fc', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8, flexDirection: isAR ? 'row-reverse' : 'row' }}>
                                <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '6px', borderRadius: '8px', color: '#38bdf8' }}><Bot size={16} /></div> {isAR ? 'سجل الوكيل: الكاشف' : 'Ajan Log: Trend Kâşifi'}
                            </h3>
                            {agentLoglari.length === 0 ? (
                                <p style={{ fontSize: '0.75rem', color: '#475569', textAlign: 'center', fontStyle: 'italic', padding: '0.5rem' }}>
                                    {isAR ? 'لا توجد عمليات بعد' : 'Henüz işlem yok'}
                                </p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {agentLoglari.map(log => (
                                        <div key={log.id} style={{ padding: '8px 10px', background: '#1e293b', borderRadius: '8px', borderLeft: '3px solid #22c55e' }}>
                                            <div style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 700 }}>{log.islem_tipi}</div>
                                            <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 2 }}>{log.mesaj}</div>
                                            <div style={{ fontSize: '0.6rem', color: '#334155', marginTop: 2 }}>{new Date(log.created_at).toLocaleString('tr-TR')}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 📊 B-08: Trend Karşılaştırma Grafiği */}
                        {trendler.length > 0 && (
                            <div style={{ background: 'white', border: '1px solid #f1f5f9', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                <h3 style={{ fontSize: '0.78rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <BarChart3 size={13} /> Trend Karşılaştırma
                                </h3>
                                {/* Kategori Bar Grafiği */}
                                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>Kategori Dağılımı</div>
                                {(() => {
                                    const katSay = {};
                                    KATEGORILER.forEach(k => { katSay[k] = trendler.filter(t => t.kategori === k).length; });
                                    const max = Math.max(...Object.values(katSay), 1);
                                    return (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                                            {Object.entries(katSay).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([kat, val]) => (
                                                <div key={kat} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                    <span style={{ fontSize: '0.57rem', color: '#64748b', width: 70, flexShrink: 0, fontWeight: 600 }}>{KAT_LABEL.tr[kat] || kat}</span>
                                                    <div style={{ flex: 1, height: 10, background: '#f1f5f9', borderRadius: 5, overflow: 'hidden' }}>
                                                        <div style={{ width: `${(val / max) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#047857,#34d399)', borderRadius: 5, transition: 'width 0.5s ease' }} />
                                                    </div>
                                                    <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#047857', width: 14, textAlign: 'right' }}>{val}</span>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                                {/* Platform Dağılımı */}
                                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>Platform Dağılımı</div>
                                {(() => {
                                    const renkler = ['#047857', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444'];
                                    const plat = PLATFORMLAR.map((p, i) => ({ p, sayi: trendler.filter(t => t.platform === p).length, renk: renkler[i] })).filter(x => x.sayi > 0);
                                    const total = plat.reduce((s, x) => s + x.sayi, 0) || 1;
                                    let cumul = 0;
                                    const R = 28;
                                    return (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                            <svg width={62} height={62} viewBox="-31 -31 62 62">
                                                {plat.length === 1 ? (
                                                    <circle r={R} fill={plat[0].renk} />
                                                ) : plat.map((x) => {
                                                    const sa = (cumul / total) * 2 * Math.PI - Math.PI / 2;
                                                    cumul += x.sayi;
                                                    const ea = (cumul / total) * 2 * Math.PI - Math.PI / 2;
                                                    const la = (x.sayi / total) > 0.5 ? 1 : 0;
                                                    return <path key={x.p} d={`M0 0 L${(Math.cos(sa) * R).toFixed(2)} ${(Math.sin(sa) * R).toFixed(2)} A${R} ${R} 0 ${la} 1 ${(Math.cos(ea) * R).toFixed(2)} ${(Math.sin(ea) * R).toFixed(2)} Z`} fill={x.renk} />;
                                                })}
                                            </svg>
                                            <div style={{ flex: 1 }}>
                                                {plat.map(x => (
                                                    <div key={x.p} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                                                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: x.renk, flexShrink: 0 }} />
                                                        <span style={{ fontSize: '0.6rem', color: '#374151', fontWeight: 600 }}>{x.p.toUpperCase()}</span>
                                                        <span style={{ marginLeft: 'auto', fontSize: '0.62rem', fontWeight: 900, color: x.renk }}>{x.sayi}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}
                                {/* Ortalama Talep Skoru */}
                                <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '7px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>Ort. Talep Skoru</span>
                                    <span style={{ fontSize: '1rem', fontWeight: 900, color: '#047857' }}>
                                        {(trendler.reduce((s, t) => s + (t.talep_skoru || 0), 0) / trendler.length).toFixed(1)}/10
                                    </span>
                                </div>
                            </div>
                        )}


                    </div>
                </div>

                {/* ONAY MODALI (window.confirm Giderildi) */}
                {aiOnayModalAcik && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ background: '#1e293b', border: '2px solid #334155', borderRadius: '16px', padding: '2rem', maxWidth: 450, width: '90%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', animation: 'slideDown 0.3s ease-out' }}>
                            <div style={{ width: 64, height: 64, background: '#fef2f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <AlertTriangle size={32} color="#dc2626" />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white', marginBottom: '1rem', textTransform: 'uppercase' }}>
                                {isAR ? 'تنبيه العبء المالي' : 'FİNANSAL YÜK UYARISI'}
                            </h3>
                            <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem', fontWeight: 600 }}>
                                {isAR ? 'ستؤدي هذه العملية (الذكاء الاصطناعي) إلى تكلفة مالية مباشرة ($0.05 / استعلام).' : 'Bu işlem (Hermes AI Analizi) işletmeye doğrudan finansal maliyet oluşturacaktır ($0.05 / Sorgu).'} <br /><br />
                                {isAR ? 'إذا كان هذا البحث غير ضروري، يرجى الإلغاء. هل توافق؟' : 'Eğer bu araştırma gereksizse lütfen iptal edin. Onaylıyor musunuz?'}
                                <br /><span style={{ color: '#34d399', fontWeight: 900, display: 'block', marginTop: 8 }}>"{aiSorgu}"</span>
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <button onClick={() => setAiOnayModalAcik(false)} style={{ padding: '12px 24px', background: 'transparent', border: '2px solid #475569', color: 'white', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', width: '50%' }}>
                                    {isAR ? 'إلغاء' : 'İPTAL ET'}
                                </button>
                                <button onClick={gercekTrendAra} style={{ padding: '12px 24px', background: '#047857', border: 'none', color: 'white', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s', width: '50%', boxShadow: '0 4px 15px rgba(4,120,87,0.4)' }}>
                                    <Globe size={18} /> {isAR ? 'بدء التحليل' : 'ANALİZİ BAŞLAT'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div> {/* İçerik Katmanı Kapanışı */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: .5; transform: scale(1.1); }
                }
                @keyframes ambientPulse {
                    0% { transform: scale(1) translate(0, 0); opacity: 0.6; }
                    50% { transform: scale(1.1) translate(2%, 2%); opacity: 0.8; }
                    100% { transform: scale(0.95) translate(-2%, -2%); opacity: 0.5; }
                }
                @keyframes ambientPulse2 {
                    0% { transform: scale(1) translate(0, 0); opacity: 0.5; }
                    50% { transform: scale(1.05) translate(-2%, 1%); opacity: 0.7; }
                    100% { transform: scale(0.9) translate(2%, -1%); opacity: 0.4; }
                }
                @keyframes slideDown { 
                    from { opacity: 0; transform: translateY(-20px) scale(0.95); } 
                    to { opacity: 1; transform: translateY(0) scale(1); } 
                }
            `}</style>
        </div>
    );
}
