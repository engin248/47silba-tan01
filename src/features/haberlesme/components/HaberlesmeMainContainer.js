'use client';
import React, { useState, useEffect } from 'react';
import {
    MessageSquare, Send, Inbox, AlertTriangle, CheckCircle2,
    Clock, User, Lock, ChevronDown, ChevronUp, Reply,
    Shield, Eye, EyeOff, Filter, Trash2, Archive, Hash, RefreshCcw,
    Camera, Mic, MicOff, ImagePlus
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/context/langContext';
import { formatTarih, telegramBildirim } from '@/lib/utils';
import { mesajSifrele, mesajCoz, sifreliMi } from '@/lib/mesajSifrele';

// ── YARDIMCI: SHA-256 hash (Web Crypto API — tarayıcı nativee) ───────────────
async function sha256(str) {
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── SABİT VERİLER ────────────────────────────────────────────────────────────
const MODULLER = [
    { key: 'kesim', label: '✂️ Kesimhane' },
    { key: 'uretim', label: '🏭 Üretim / İmalat' },
    { key: 'kalip', label: '📐 Kalıphane' },
    { key: 'kasa', label: '💰 Kasa' },
    { key: 'muhasebe', label: '📊 Muhasebe' },
    { key: 'depo', label: '📦 Depo / Stok' },
    { key: 'personel', label: '👥 Personel' },
    { key: 'siparis', label: '📋 Siparişler' },
    { key: 'koordinator', label: '🎯 Koordinatör' },
    { key: 'yonetim', label: '👑 Yönetim' },
    { key: 'genel', label: '📢 Genel' },
];

const ONCELIK = {
    normal: { bg: '#f0f9ff', border: '#0ea5e9', badge: '#0ea5e9', label: '🔵 Normal' },
    acil: { bg: '#fffbeb', border: '#f59e0b', badge: '#f59e0b', label: '🟡 Acil' },
    kritik: { bg: '#fef2f2', border: '#ef4444', badge: '#ef4444', label: '🔴 Kritik' },
};

const TIP_LABEL = {
    bilgi: '📌 Bilgi',
    gorev_talebi: '✅ Görev Talebi',
    onay_bekleniyor: '⏳ Onay Bekliyor',
    sikayet: '⚠️ Şikayet / Sorun',
    rapor: '📊 Rapor',
};

const ONAY_RENK = {
    bekliyor: { bg: '#fef9c3', text: '#713f12', label: '⏳ Onay Bekleniyor' },
    onaylandi: { bg: '#dcfce7', text: '#166534', label: '✅ Onaylandı' },
    reddedildi: { bg: '#fee2e2', text: '#991b1b', label: '❌ Reddedildi' },
};

const BOŞ_FORM = {
    konu: '', icerik: '', alici_grup: 'hepsi',
    oncelik: 'normal', tip: 'bilgi',
    ilgili_modul: '', ilgili_kayit_ozet: '',
    urun_id: '',      // ürün/model ortak anahtar
    urun_kodu: '',    // snapshot — MODEL-47-A
    urun_adi: '',     // snapshot — Kırmızı Ceket V2
};

// YETKİ — bu grup üyeleri Tam Arşiv'e erişebilir
const TAM_ARŞİV_GRUPLARI = ['tam', 'yonetim', 'koordinator', 'isletme'];

// MODEL GEÇMİŞİ OKUMA — bu birimler urun_id bağlantılı mesajları okuyabilir
// Amaç: aynı hatayı tekrarlamamak, üretim sürecinde referans almak, ajan öğrenmesi
const URETIM_BIRIMLERI = ['uretim', 'kesim', 'kalip', 'arge', 'modelhane', 'tasarim'];
const uretimBirimiMi = (modul) => URETIM_BIRIMLERI.includes(modul);

// 🔐 ŞİFRELİ İÇERİK GÖRÜNTÜLEYICI
function CozulmusIcerik({ icerik }) {
    const [metin, setMetin] = useState(/** @type {string|null} */(null));
    useEffect(() => {
        let iptal = false;
        mesajCoz(icerik || '').then(cozulmus => {
            if (!iptal) setMetin(cozulmus);
        });
        return () => { iptal = true; };
    }, [icerik]);
    if (metin === null) return <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>🔐 Çözülüyor...</span>;
    return <>{metin}</>;
}

export default function HaberlesmeMainContainer() {

    const { kullanici } = useAuth();
    const _kul = /** @type {any} */ (kullanici);
    const { lang } = useLang();
    const isAR = lang === 'ar';

    const [sekme, setSekme] = useState('gelen');
    const [mesajlar, setMesajlar] = useState(/** @type {any[]} */([]));
    const [gizliIdler, setGizliIdler] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [bildirim, setBildirim] = useState({ text: '', type: '' });
    const [form, setForm] = useState(BOŞ_FORM);
    const [gonderiliyor, setGonderiliyor] = useState(false);
    const [acikMesaj, setAcikMesaj] = useState(/** @type {any} */(null));
    const [yanitMod, setYanitMod] = useState(false);
    const [yanitIcerik, setYanitIcerik] = useState('');
    const [onayNotu, setOnayNotu] = useState('');
    const [filtreOncelik, setFiltreOncelik] = useState('hepsi');
    const [filtreGizli, setFiltreGizli] = useState(false);
    const [okunmamisSayi, setOkunmamisSayi] = useState(0);
    const [aktifModeller, setAktifModeller] = useState(/** @type {any[]} */([]));
    const [dinliyor, setDinliyor] = useState(false);

    const kullaniciModul = _kul?.modul || _kul?.grup || 'genel';
    const kullaniciAdi = _kul?.ad || _kul?.email || 'Bilinmeyen';
    const tamArsivYetkisi = TAM_ARŞİV_GRUPLARI.includes(_kul?.grup);

    // ── REALTIME & EKLENTİ YÜKLEME ─────────────────────────────────────────────────────────────
    useEffect(() => {
        const modelleriGetir = async () => {
            const { data } = await supabase.from('b1_model_taslaklari').select('id, model_kodu, model_adi').order('created_at', { ascending: false }).limit(500);
            if (data) setAktifModeller(data);
        };
        modelleriGetir();
    }, []);

    useEffect(() => {
        if (!kullanici) return;
        yukle();
        const kanal = supabase.channel('haberlesme-rt')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_ic_mesajlar' }, () => yukle())
            .subscribe();
        return () => supabase.removeChannel(kanal);
    }, [kullanici, sekme]);

    const goster = (text, type = 'success') => {
        setBildirim({ text, type });
        setTimeout(() => setBildirim({ text: '', type: '' }), 5000);
    };

    // ── VERİ YÜKLE ───────────────────────────────────────────────────────────
    const yukle = async () => {
        if (!kullanici) return;
        setLoading(true);
        try {
            let query = supabase
                .from('b1_ic_mesajlar')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(200);

            if (sekme === 'gelen') {
                // Gelen kutusu: grubuma gönderilen + herkese gönderilen
                // + üretim birimi isem model geçmişi (urun_id dolu mesajlar)
                const temelFiltre = `alici_grup.eq.${kullaniciModul},alici_grup.eq.hepsi`;
                if (uretimBirimiMi(kullaniciModul)) {
                    query = query.or(`${temelFiltre},urun_id.not.is.null`);
                } else {
                    query = query.or(temelFiltre);
                }
            } else if (sekme === 'gonderilen') {
                // Kendi gönderdikleri: gonderen_modul veya gonderen_adi ile filtrele
                query = query.eq('gonderen_modul', kullaniciModul);
                if (kullaniciAdi !== 'Bilinmeyen') {
                    query = query.eq('gonderen_adi', kullaniciAdi);
                }
            } else if (sekme === 'arsiv') {
                // Tam Arşiv: koordinatör/yönetim → tüm kayıtlar
                // Üretim birimi → kendi modulu + model geçmişi
                // Genel → yalnızca kendi modulu
                if (tamArsivYetkisi) {
                    // tüm kayıtlar — ek filtre yok
                } else if (uretimBirimiMi(kullaniciModul)) {
                    query = query.or(
                        `gonderen_modul.eq.${kullaniciModul},` +
                        `alici_grup.eq.${kullaniciModul},urun_id.not.is.null`
                    );
                } else {
                    query = query.or(
                        `gonderen_modul.eq.${kullaniciModul},alici_grup.eq.${kullaniciModul}`
                    );
                }
            } else if (sekme === 'cop') {
                // Sadece Çöp Kovası (Sadece KOORDİNATÖR görür)
                query = query.eq('copte', true);
            }

            const { data, error } = await query;
            if (error) throw error;

            setMesajlar(data || []);

            // Gizleme listesi: UUID yerine grup bazlı — simdilik boş set dönülüyor
            // (b1_mesaj_gizli tablosu UUID bazlı — ileriki sürümde profil entegrasyonu ile geliştirilebilir)
            setGizliIdler(new Set());

            // Okunmamis sayı (gelen sekme icin) - Çöpte olmayanlar!
            if (sekme === 'gelen') {
                const okunmamis = (data || []).filter(m =>
                    !m.okundu_at && m.gonderen_modul !== kullaniciModul && !m.copte
                ).length;
                setOkunmamisSayi(okunmamis);
            }
        } catch (err) {
            goster('Yükleme hatası: ' + err.message, 'error');
        }
        setLoading(false);
    };

    // ── SESLİ DİKTE ──────────────────────────────────────────────────────────
    const sesliYazdir = () => {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) return alert('Tarayıcınız sesli komutu desteklemiyor. Lütfen Chrome vb. kullanın.');

        const rec = new SpeechRec();
        rec.lang = 'tr-TR';
        rec.continuous = false;
        rec.interimResults = false;

        rec.onstart = () => { setDinliyor(true); goster('Dinleniyor... Konuşun.', 'success'); };
        rec.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            setForm(prev => ({ ...prev, icerik: prev.icerik ? prev.icerik + ' ' + transcript : transcript }));
        };
        rec.onerror = (e) => {
            console.error(e);
            goster('Ses algılamadı: ' + e.error, 'error');
        };
        rec.onend = () => { setDinliyor(false); };

        try { rec.start(); } catch (err) { console.warn('[UYARI] Ses Tanıma API Başlatılamadı:', err); }
    };

    // ── MESAJ AÇ + OKUNDU DAMGASI ────────────────────────────────────────────
    const mesajAc = async (m) => {
        setAcikMesaj(acikMesaj?.id === m.id ? null : m);
        setYanitMod(false);
        setYanitIcerik('');

        const beniAlici = m.alici_grup === kullaniciModul || m.alici_grup === 'hepsi';
        const beniGondermedi = m.gonderen_modul !== kullaniciModul;

        if (!m.okundu_at && beniAlici && beniGondermedi) {
            try {
                await supabase.from('b1_ic_mesajlar').update({
                    durum: 'okundu',
                    okundu_at: new Date().toISOString(),
                }).eq('id', m.id);
                // Yerel state güncelle — sabırla yeniden yükleme yok
                setMesajlar(prev => prev.map(x =>
                    x.id === m.id ? { ...x, durum: 'okundu', okundu_at: new Date().toISOString() } : x
                ));
                // Badge sayacını azalt
                setOkunmamisSayi(prev => Math.max(0, prev - 1));
            } catch { /* sessiz */ }
        }
    };

    // ── GÖNDER ───────────────────────────────────────────────────────────────
    const gonder = async () => {
        if (!form.urun_kodu.trim() && !form.urun_id.trim()) {
            return goster('📦 LÜTFEN ÜRÜN VEYA MODEL KODU GİRİN! Boş muhabbet ve sistemsiz mesajlaşma yasaktır.', 'error');
        }
        if (!form.konu.trim()) return goster('Konu zorunlu!', 'error');
        if (!form.icerik.trim()) return goster('İçerik zorunlu!', 'error');
        if (!kullanici) return goster('Giriş yapmanız gerekiyor.', 'error');

        setGonderiliyor(true);
        try {
            // SHA-256 — içerik + gönderen + zaman damgası
            const zamanDamgasi = new Date().toISOString();
            const hashGirdisi = `${form.icerik.trim()}|${kullaniciAdi}|${zamanDamgasi}`;
            const hash = await sha256(hashGirdisi);

            // [MODEL-KODU] prefix — her mesaj model koduyla başlar
            const konuPrefix = form.urun_kodu.trim() ? `[${form.urun_kodu.trim()}] ` : '';
            const sonKonu = konuPrefix + form.konu.trim();

            // 🔐 AES-256-GCM ŞİFRELEME — içerik Supabase'e gitmeden şifrelenir
            const sifreliIcerik = await mesajSifrele(form.icerik.trim());

            const { error } = await supabase.from('b1_ic_mesajlar').insert([{
                konu: sonKonu,
                icerik: sifreliIcerik,
                mesaj_hash: hash,             // içerik bütünlüğü damgası
                gonderen_id: null,                // PIN sistemi UUID üretmiyor — grup bazlı kimlik
                gonderen_adi: kullaniciAdi,
                gonderen_modul: kullaniciModul,
                alici_grup: form.alici_grup,
                oncelik: form.oncelik,
                tip: form.tip,
                durum: 'gonderildi',
                ilgili_modul: form.ilgili_modul || null,
                ilgili_kayit_ozet: form.ilgili_kayit_ozet.trim() || null,
                // Ürün/Model ortak anahtar (snapshot — değiştirilemeyen kanıt)
                urun_id: form.urun_id.trim() || null,
                urun_kodu: form.urun_kodu.trim() || null,
                urun_adi: form.urun_adi.trim() || null,
                onay_durumu: form.tip === 'onay_bekleniyor' ? 'bekliyor' : null,
                created_at: zamanDamgasi,
            }]);
            if (error) throw error;

            if (form.oncelik === 'kritik' || form.oncelik === 'acil') {
                const alici = MODULLER.find(m => m.key === form.alici_grup)?.label || form.alici_grup;
                telegramBildirim(
                    `📨 ${form.oncelik === 'kritik' ? '🔴 KRİTİK' : '🟡 ACİL'} MESAJ\n` +
                    `Gönderen: ${kullaniciAdi} (${kullaniciModul})\n` +
                    `Alıcı: ${alici}\n` +
                    `Konu: ${sonKonu}`
                );
            }

            goster('✅ Mesaj gönderildi ve SHA-256 damgalandı.', 'success');
            setForm(BOŞ_FORM);
            setSekme('gonderilen');
            yukle();
        } catch (err) {
            goster('Gönderme hatası: ' + err.message, 'error');
        }
        setGonderiliyor(false);
    };

    // ── SİLME YETKİ MATRİSİ ─────────────────────────────────────────────────
    //
    // ┌────────────────────────────────┬──────────────┬──────────┬──────────┐
    // │ Mesaj Türü                      │ tam (Koord.) │ üretim   │ genel    │
    // ├────────────────────────────────┼──────────────┼──────────┼──────────┤
    // │ Kendi yazan kanal mesajı       │ ✅ Silebilir │ ✅ Kendi  │ ✅ Kendi  │
    // │ Başkasının kanal mesajı       │ ✅ Silebilir │ ❌       │ ❌       │
    // ├────────────────────────────────┼──────────────┼──────────┼──────────┤
    // │ Model/Sipariş ref. notu         │ ✅ PIN ile  │ ❌ YASAK  │ ❌ YASAK  │
    // └────────────────────────────────┴──────────────┴──────────┴──────────┘
    //
    const REFERANS_NOTA_MI = (m) => !!(m.urun_id || m.ilgili_modul || ['sikayet', 'rapor'].includes(m.tip));

    const silYetkisiVarMi = (m) => {
        if (REFERANS_NOTA_MI(m)) {
            return tamArsivYetkisi; // referans nota → yalnızca koordinatör (+ PIN)
        }
        // Normal mesaj: kendi yazdıysa silebilir; koordinatör herkesinkini silebilir
        return tamArsivYetkisi || m.gonderen_id === kullanici?.id;
    };

    const silNeden = (m) => {
        if (m.urun_id) {
            return `Bu mesaj ÜRÜN/MODEL kaydına bağlıdır.\n` +
                `Kod: ${m.urun_kodu || m.urun_id}\nModel: ${m.urun_adi || '—'}\n\n` +
                `Üretim sürecinde referans kanıt niteliği taşır.\n` +
                `Yalnızca Koordinatör PIN ile silebilir.`;
        }
        if (m.ilgili_modul) {
            const modul = MODULLER.find(x => x.key === m.ilgili_modul)?.label || m.ilgili_modul;
            return `Bu mesaj ${modul} modülüne bağlıdır.\n` +
                `Üretim sürecinde referans kanıt niteliği taşır.\n` +
                `Yalnızca Koordinatör PIN ile silebilir.`;
        }
        if (m.tip === 'sikayet') return 'Şikayet mesajları kanıt niteliği taşır.\nYalnızca Koordinatör PIN ile silebilir.';
        if (m.tip === 'rapor') return 'Rapor mesajları arşivden silinemez.\nYalnızca Koordinatör PIN ile silebilir.';
        if (m.gonderen_id !== kullanici?.id) return 'Başkasının yazdığı mesajlar silinemez.';
        return '';
    };

    // ── GİZLE (ÇÖPE AT - Soft-delete) ────────────────────────────
    const gizle = async (m, e) => {
        e.stopPropagation();
        if (!silYetkisiVarMi(m)) {
            alert(`⛔ SİLME YETKİSİ YOK\n\n${silNeden(m)}`);
            return;
        }

        // Koordinatör + Referans nota → PIN gerekli
        if (tamArsivYetkisi && REFERANS_NOTA_MI(m)) {
            const pin = prompt(
                `🔒 KOORDİNATÖR PIN DOGRULAMA\n\n` +
                `Bu mesaj referans kanıt niteliği taşıyor.\n` +
                `Konu: "${m.konu}"\n\n` +
                `Çöpe atmak için Koordinatör PIN kodunu girin:`
            );
            if (!pin) return;
            const { yetkili } = await import('@/lib/silmeYetkiDogrula')
                .then(m => m.silmeYetkiDogrula(kullanici, pin))
                .catch(() => ({ yetkili: false }));
            if (!yetkili) {
                alert('⛔ Yanlış PIN. İşlem iptal edildi.');
                goster('Yanlış PIN — referans nota silinemedi.', 'error');
                return;
            }
        }

        const uyari = (tamArsivYetkisi && REFERANS_NOTA_MI(m))
            ? `KOORDİNATÖR: Referans not çöpe atılacak.\nMesaj sistem loglarında korunmaya devam eder.\nDevam?`
            : `Bu mesaj Çöp Kovasına taşınacak (Sizin için ve karşı taraf için gizlenir).\n45 gün sonra otomatik silinir.\nDevam?`;

        if (!confirm(uyari)) return;

        try {
            await supabase.from('b1_ic_mesajlar').update({
                copte: true,
                cop_tarihi: new Date().toISOString()
            }).eq('id', m.id);

            if (tamArsivYetkisi) {
                await supabase.from('b0_sistem_loglari').insert([{
                    tablo_adi: 'b1_ic_mesajlar',
                    islem_tipi: REFERANS_NOTA_MI(m) ? 'KOORDINATOR_REF_NOT_COPE_ATTI' : 'KOORDINATOR_COPE_ATTI',
                    kullanici_adi: kullaniciAdi,
                    eski_veri: { mesaj_id: m.id, konu: m.konu, gonderen: m.gonderen_adi, referans_mi: REFERANS_NOTA_MI(m) },
                }]);
            }
            if (acikMesaj?.id === m.id) setAcikMesaj(null);
            goster('🗑️ Mesaj Çöp Kovasına taşındı.', 'success');
            yukle();
        } catch (err) {
            goster('Çöpe atma hatası: ' + err.message, 'error');
        }
    };

    // ── ÇÖPTEN GERİ YÜKLE (RESTORE) SADECE KOORDİNATÖR ──────────────────────────
    const copeGeriAl = async (m, e) => {
        e.stopPropagation();
        if (!tamArsivYetkisi) return goster('Sadece Koordinatör mesajları geri getirebilir.', 'error');
        try {
            await supabase.from('b1_ic_mesajlar').update({
                copte: false,
                cop_tarihi: null
            }).eq('id', m.id);
            goster('✅ Mesaj Çöp Kovasından geri çekildi.', 'success');
            setAcikMesaj(null);
            yukle();
        } catch (err) {
            goster('Geri yükleme hatası: ' + err.message, 'error');
        }
    };

    // ── YANIT ─────────────────────────────────────────────────────────────────
    const yanitGonder = async () => {
        if (!yanitIcerik.trim()) return goster('Yanıt içeriği boş olamaz.', 'error');
        try {
            const zamanDamgasi = new Date().toISOString();
            const hash = await sha256(`${yanitIcerik.trim()}|${kullaniciAdi}|${zamanDamgasi}`);

            // 🔐 Yanıt da şifreleniyor
            const sifreliYanit = await mesajSifrele(yanitIcerik.trim());

            const { error } = await supabase.from('b1_ic_mesajlar').insert([{
                konu: 'RE: ' + acikMesaj.konu,
                icerik: sifreliYanit,
                mesaj_hash: hash,
                gonderen_id: kullanici.id,
                gonderen_adi: kullaniciAdi,
                gonderen_modul: kullaniciModul,
                alici_id: acikMesaj.gonderen_id,
                alici_adi: acikMesaj.gonderen_adi,
                oncelik: acikMesaj.oncelik,
                tip: 'bilgi',
                durum: 'gonderildi',
                yanit_id: acikMesaj.id,
                created_at: zamanDamgasi,
            }]);
            if (error) throw error;

            await supabase.from('b1_ic_mesajlar')
                .update({ durum: 'islem_alindi' }).eq('id', acikMesaj.id);

            goster('✅ Yanıt gönderildi.', 'success');
            setYanitMod(false); setYanitIcerik(''); yukle();
        } catch (err) { goster('Yanıt hatası: ' + err.message, 'error'); }
    };

    // ── ONAY ─────────────────────────────────────────────────────────────────
    const onayIslem = async (mesajId, karar) => {
        if (!tamArsivYetkisi) return goster('Onay yetkisi yalnızca yönetim/koordinatörde.', 'error');
        try {
            await supabase.from('b1_ic_mesajlar').update({
                onay_durumu: karar,
                onaylayan_id: kullanici.id,
                onaylayan_adi: kullaniciAdi,
                onay_notu: onayNotu.trim() || null,
                onaylandi_at: new Date().toISOString(),
                durum: 'kapatildi',
            }).eq('id', mesajId);

            await supabase.from('b0_sistem_loglari').insert([{
                tablo_adi: 'b1_ic_mesajlar',
                islem_tipi: karar === 'onaylandi' ? 'ONAY' : 'RED',
                kullanici_adi: kullaniciAdi,
                eski_veri: { mesaj_id: mesajId, karar, not: onayNotu },
            }]);

            goster(`${karar === 'onaylandi' ? '✅ Onaylandı' : '❌ Reddedildi'} — kayıt altına alındı.`, 'success');
            setAcikMesaj(null); setOnayNotu(''); yukle();
        } catch (err) { goster('Onay hatası: ' + err.message, 'error'); }
    };

    // ── FİLTRELEME ───────────────────────────────────────────────────────────
    const filtreli = mesajlar.filter(m => {
        const oncelikOk = filtreOncelik === 'hepsi' || m.oncelik === filtreOncelik;
        if (sekme === 'cop') return oncelikOk; // Çöpteki herşeyi göster
        if (sekme === 'arsiv' && tamArsivYetkisi) {
            // Tam Arşiv: çöpte olmayanları göster.
            return oncelikOk && !m.copte;
        }
        // Diğer sekmelerde çöpte olanları GÖSTERME
        return oncelikOk && !m.copte;
    });

    const gizlenmisSayi = mesajlar.filter(m => m.copte).length;

    // ── STYLES ───────────────────────────────────────────────────────────────
    const inp = {
        width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb',
        borderRadius: 8, fontSize: '0.875rem', fontFamily: 'inherit',
        boxSizing: 'border-box', outline: 'none',
    };
    const lbl = {
        display: 'block', fontSize: '0.68rem', fontWeight: 800,
        color: '#374151', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em',
    };

    // ── RENDER ───────────────────────────────────────────────────────────────
    return (
        <div dir={isAR ? 'rtl' : 'ltr'}>

            {/* BAŞLIK & İKAZ BANNERI */}
            {okunmamisSayi > 0 && sekme !== 'yeni' && (
                <div style={{ background: '#fef2f2', border: '2px solid #ef4444', borderRadius: 12, padding: '12px 16px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: 'brzTitres 2s ease-in-out infinite' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <AlertTriangle size={24} color="#dc2626" />
                        <div>
                            <div style={{ fontWeight: 900, color: '#991b1b', fontSize: '1rem' }}>SİSTEM İKAZI: OKUNMAYAN MESAJLAR VAR!</div>
                            <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 700 }}>Lütfen hemen gelen kutunuzu kontrol edin. Görev / bildirim bekliyor.</div>
                        </div>
                    </div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#dc2626' }}>{okunmamisSayi}</span>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: 10 }}>
                {/* SOL: BAŞLIK */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#1e1b4b,#3730a3)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(30,27,75,0.3)' }}>
                        <MessageSquare size={26} color="white" />
                    </div>
                    <div style={{ background: '#1d4ed8', color: 'white', padding: '4px 10px', borderRadius: '4px', display: 'inline-block' }}>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', margin: 0 }}>NIZAM Haberleşme</h1>
                        <p style={{ fontSize: '0.72rem', color: '#dbeafe', margin: '2px 0 0', fontWeight: 600 }}>
                            Adil · Şeffaf · SHA-256 Damgalı · Silinmez Arşiv
                        </p>
                    </div>
                </div>

                {/* SAĞ: İSTATİSTİK ve YENİ MESAJ BUTONU */}
                <div style={{ display: 'flex', alignItems: 'stretch', gap: '0.625rem' }}>
                    {[
                        { label: 'Okunmamış', val: okunmamisSayi, color: '#ef4444', bg: '#fef2f2', ikon: '📬' },
                        { label: 'Toplam', val: mesajlar.length, color: '#0ea5e9', bg: '#f0f9ff', ikon: '📨' },
                        { label: 'Onay Bekleyen', val: mesajlar.filter(m => m.onay_durumu === 'bekliyor').length, color: '#d97706', bg: '#fffbeb', ikon: '⏳' },
                        { label: 'Arşiv Gizlenen', val: gizliIdler.size, color: '#7c3aed', bg: '#f5f3ff', ikon: '🫥' },
                    ].map((s, i) => (
                        <div key={i} style={{ background: s.bg, border: `1px solid ${s.color}30`, borderRadius: 12, padding: '0.5rem 1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: '110px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                <span style={{ fontSize: '0.9rem' }}>{s.ikon}</span>
                                <span style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</span>
                            </div>
                            <div style={{ fontWeight: 900, fontSize: '1.3rem', color: s.color }}>{s.val}</div>
                        </div>
                    ))}
                    <button onClick={() => { setSekme('yeni'); setAcikMesaj(null); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1e1b4b', color: 'white', border: 'none', padding: '0 18px', borderRadius: 12, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 14px rgba(30,27,75,0.3)', fontSize: '0.875rem' }}>
                        <Send size={16} /> Yeni Mesaj
                    </button>
                </div>
            </div>

            {/* BİLDİRİM */}
            {bildirim.text && (
                <div style={{ padding: '10px 16px', marginBottom: '1rem', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', border: '2px solid', borderColor: bildirim.type === 'error' ? '#ef4444' : '#10b981', background: bildirim.type === 'error' ? '#fef2f2' : '#ecfdf5', color: bildirim.type === 'error' ? '#b91c1c' : '#065f46', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {bildirim.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />} {bildirim.text}
                </div>
            )}

            {/* SEKMELER */}
            <div style={{ display: 'flex', gap: 3, background: '#f1f5f9', borderRadius: 12, padding: 4, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                {[
                    { key: 'gelen', label: `📥 Gelen${okunmamisSayi > 0 ? ` (${okunmamisSayi})` : ''}` },
                    { key: 'gonderilen', label: '📤 Gönderilenler' },
                    { key: 'arsiv', label: tamArsivYetkisi ? '🗄️ Tam Arşiv' : '🗄️ Arşiv' },
                    ...(tamArsivYetkisi ? [{ key: 'cop', label: '🗑️ Çöp Kovası' }] : []),
                    { key: 'yeni', label: '✏️ Yeni Mesaj' },
                ].map(s => (
                    <button key={s.key} onClick={() => { setSekme(s.key); setAcikMesaj(null); setFiltreGizli(false); }}
                        style={{ flex: 1, minWidth: 100, padding: '9px 8px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.78rem', transition: 'all 0.2s', background: sekme === s.key ? (s.key === 'cop' ? '#fef2f2' : 'white') : 'transparent', color: sekme === s.key ? (s.key === 'cop' ? '#dc2626' : '#1e1b4b') : '#64748b', boxShadow: sekme === s.key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}>
                        {s.label}
                    </button>
                ))}
            </div>

            {/* ═══════════════ YENİ MESAJ FORMU ═══════════════ */}
            {sekme === 'yeni' && (
                <div style={{ background: 'white', border: '2px solid #1e1b4b', borderRadius: 16, padding: '1.5rem', boxShadow: '0 8px 32px rgba(30,27,75,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '2px solid #f1f5f9' }}>
                        <Shield size={20} color="#1e1b4b" />
                        <div>
                            <div style={{ fontWeight: 900, color: '#1e1b4b', fontSize: '1rem' }}>Yeni Mesaj — SHA-256 Korumalı</div>
                            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
                                Gönderildikten sonra içerik değiştirilemez. Zaman damgalı, hash imzalı, silinmez arşivlenir.
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>

                        {/* MODEL KODU — en üste — tüm mesajların başlangıc noktası */}
                        <div style={{ gridColumn: '1/-1', background: '#1e1b4b', borderRadius: 10, padding: '0.875rem 1rem', marginBottom: 4 }}>
                            <label style={{ ...lbl, color: '#a5b4fc', marginBottom: 6 }}>📦 Ürün / Model Kodu * (ZORUNLU — Aktif Modellerden Seçin)</label>

                            <select
                                value={form.urun_id}
                                onChange={e => {
                                    const secilen = aktifModeller.find(m => m.id === e.target.value);
                                    if (secilen) {
                                        setForm({ ...form, urun_id: secilen.id, urun_kodu: secilen.model_kodu, urun_adi: secilen.model_adi });
                                    } else {
                                        setForm({ ...form, urun_id: '', urun_kodu: '', urun_adi: '' });
                                    }
                                }}
                                style={{ ...inp, background: '#0f172a', color: '#e2e8f0', border: '1px solid #3730a3', fontWeight: 800, cursor: 'pointer' }}
                            >
                                <option value="">-- Listeden Model Seçin --</option>
                                {aktifModeller.map(m => (
                                    <option key={m.id} value={m.id}>[ {m.model_kodu} ] — {m.model_adi}</option>
                                ))}
                            </select>

                            {/* CANLI ÖNİZLEME */}
                            {(form.urun_kodu || form.konu) && (
                                <div style={{ marginTop: 8, padding: '6px 10px', background: '#0f172a', borderRadius: 6, fontSize: '0.75rem', color: '#a5b4fc', fontWeight: 800, letterSpacing: '0.02em' }}>
                                    📨 Konu görünümü: {form.urun_kodu ? `[${form.urun_kodu}] ` : ''}{form.konu || '...'}
                                </div>
                            )}
                        </div>

                        <div style={{ gridColumn: '1/-1' }}>
                            <label style={lbl}>Konu *</label>
                            <input maxLength={150} value={form.konu} onChange={e => setForm({ ...form, konu: e.target.value })} placeholder="Mesajın konusu" style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Alıcı Departman</label>
                            <select value={form.alici_grup} onChange={e => setForm({ ...form, alici_grup: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                                <option value="hepsi">📢 Herkes</option>
                                {MODULLER.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>Öncelik</label>
                            <select value={form.oncelik} onChange={e => setForm({ ...form, oncelik: e.target.value })} style={{ ...inp, cursor: 'pointer', borderColor: ONCELIK[form.oncelik].border }}>
                                <option value="normal">🔵 Normal — Yalnızca DB</option>
                                <option value="acil">🟡 Acil — Zil</option>
                                <option value="kritik">🔴 Kritik — Zil + Telegram</option>
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>Mesaj Tipi</label>
                            <select value={form.tip} onChange={e => setForm({ ...form, tip: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                                {Object.entries(TIP_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>İlgili Modül (Opsiyonel)</label>
                            <select value={form.ilgili_modul} onChange={e => setForm({ ...form, ilgili_modul: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                                <option value="">— Seçiniz —</option>
                                {MODULLER.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
                            </select>
                        </div>
                        {form.ilgili_modul && (
                            <div>
                                <label style={lbl}>İlgili Kayıt</label>
                                <input maxLength={150} value={form.ilgili_kayit_ozet} onChange={e => setForm({ ...form, ilgili_kayit_ozet: e.target.value })} placeholder="Örn: Sipariş #47" style={inp} />
                            </div>
                        )}
                        <div style={{ gridColumn: '1/-1' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 5 }}>
                                <label style={{ ...lbl, marginBottom: 0 }}>Mesaj İçeriği *</label>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button type="button" onClick={() => setForm(p => ({ ...p, icerik: p.icerik + '\n\n[📸 Eklenti: Fotoğraf_numune.jpg (Bulut Depolama Devre Dışı Koruması)]' }))}
                                        style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '4px 10px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>
                                        <Camera size={14} /> Foto Ekle
                                    </button>
                                    <button type="button" onClick={sesliYazdir}
                                        style={{ display: 'flex', alignItems: 'center', gap: 4, background: dinliyor ? '#fee2e2' : '#f0fdf4', color: dinliyor ? '#dc2626' : '#166534', border: `1px solid ${dinliyor ? '#fca5a5' : '#bbf7d0'}`, padding: '4px 10px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', animation: dinliyor ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none' }}>
                                        {dinliyor ? <MicOff size={14} /> : <Mic size={14} />} {dinliyor ? 'Dinleniyor...' : 'Sesli Yazım'}
                                    </button>
                                </div>
                            </div>
                            <textarea maxLength={2000} rows={5} value={form.icerik} onChange={e => setForm({ ...form, icerik: e.target.value })} placeholder="Mesajınızı yazın. Bu içerik gönderildikten sonra değiştirilemez." style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
                        </div>
                    </div>

                    {form.oncelik === 'kritik' && (
                        <div style={{ background: '#fef2f2', border: '2px solid #ef4444', borderRadius: 10, padding: '10px 14px', marginBottom: '1rem', fontSize: '0.8rem', color: '#991b1b', fontWeight: 700 }}>
                            🔴 KRİTİK — Telegram bildirimi ve koordinatöre anlık uyarı gönderilecek. (Maks 3 adet/gün/kullanıcı)
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <button onClick={() => setForm(BOŞ_FORM)} style={{ padding: '10px 20px', border: '2px solid #e5e7eb', borderRadius: 8, background: 'white', fontWeight: 700, cursor: 'pointer' }}>Temizle</button>
                        <button onClick={gonder} disabled={gonderiliyor}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 28px', background: gonderiliyor ? '#94a3b8' : '#1e1b4b', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: gonderiliyor ? 'not-allowed' : 'pointer' }}>
                            <Send size={16} /> {gonderiliyor ? 'Gönderiliyor...' : 'Gönder & SHA-256 Damgala'}
                        </button>
                    </div>

                    <div style={{ marginTop: '1rem', padding: '8px 12px', background: '#f8fafc', borderRadius: 8, fontSize: '0.68rem', color: '#7c3aed', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Hash size={12} /> SHA-256 bütünlük damgası otomatik hesaplanır. İçerik sonradan değiştirilirse hash uyuşmaz — manipülasyon kanıtlanır.
                    </div>
                </div>
            )}

            {/* ═══════════════ MESAJ LİSTESİ ═══════════════ */}
            {['gelen', 'gonderilen', 'arsiv', 'cop'].includes(sekme) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* FİLTRE BAR */}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Filter size={14} color="#64748b" />
                        {['hepsi', 'normal', 'acil', 'kritik'].map(f => (
                            <button key={f} onClick={() => setFiltreOncelik(f)}
                                style={{ padding: '4px 12px', border: '2px solid', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem', borderColor: filtreOncelik === f ? (ONCELIK[f]?.border || '#1e1b4b') : '#e5e7eb', background: filtreOncelik === f ? (ONCELIK[f]?.border || '#1e1b4b') : 'white', color: filtreOncelik === f ? 'white' : '#374151' }}>
                                {f === 'hepsi' ? 'Tümü' : ONCELIK[f].label}
                            </button>
                        ))}

                        {/* TAM ARŞİV YETKİSİ BANNER + GİZLENENLER TOGGLE */}
                        {sekme === 'arsiv' && tamArsivYetkisi && (
                            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                                {gizlenmisSayi > 0 && (
                                    <button onClick={() => setFiltreGizli(!filtreGizli)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', border: `2px solid ${filtreGizli ? '#7c3aed' : '#e5e7eb'}`, borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem', background: filtreGizli ? '#7c3aed' : 'white', color: filtreGizli ? 'white' : '#7c3aed' }}>
                                        <Trash2 size={11} /> Kullanıcı Gizledikleri ({gizlenmisSayi})
                                    </button>
                                )}
                                <span style={{ fontSize: '0.68rem', color: '#7c3aed', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Shield size={12} /> Tam Arşiv Yetkisi Aktif
                                </span>
                            </div>
                        )}
                    </div>

                    {/* ÇÖP KOVASI BİLGİ */}
                    {sekme === 'cop' && tamArsivYetkisi && (
                        <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: '#991b1b', fontWeight: 700, width: '100%' }}>
                            <Trash2 size={14} />
                            Bu mesajlar kullanıcılar tarafından gizlenmiş (Çöpe Atılmış). 45 gün sonra kalıcı olarak silinecektir. Ürün ve Model ile ilgili arşiv kayıtları 45 gün geçse bile SİLİNMEZ!
                        </div>
                    )}

                    {/* TAM ARŞİV UYARISI */}
                    {sekme === 'arsiv' && tamArsivYetkisi && (
                        <div style={{ padding: '10px 14px', background: '#1e1b4b', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: '#a5b4fc', fontWeight: 700, width: '100%' }}>
                            <Shield size={14} />
                            Koordinatör / Yönetim görünümü — Tüm mesajlar görüntüleniyor. Çöpte olanlar Çöp Kovası sekmesindedir.
                        </div>
                    )}

                    {loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontWeight: 700 }}>Yükleniyor...</div>}

                    {!loading && filtreli.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: 16, border: '2px dashed #e5e7eb' }}>
                            <Inbox size={48} style={{ color: '#e5e7eb', margin: '0 auto 1rem', display: 'block' }} />
                            <p style={{ color: '#94a3b8', fontWeight: 700, margin: 0 }}>
                                {isAR ? 'لا توجد رسائل.' : 'Mesaj bulunamadı.'}
                            </p>
                        </div>
                    )}

                    {filtreli.map(m => {
                        const renk = ONCELIK[m.oncelik] || ONCELIK.normal;
                        const okundu = !!m.okundu_at || m.gonderen_id === kullanici?.id;
                        const acik = acikMesaj?.id === m.id;
                        const gizlendi = m.copte;

                        return (
                            <div key={m.id}
                                style={{
                                    background: gizlendi ? '#f9fafb' : (acik ? '#f8f7ff' : (!okundu ? renk.bg : 'white')),
                                    border: `2px solid ${gizlendi ? '#d1d5db' : (acik ? '#1e1b4b' : (!okundu ? renk.border : '#e5e7eb'))}`,
                                    borderRadius: 14, padding: '1rem 1.25rem', cursor: 'pointer',
                                    transition: 'all 0.15s', opacity: gizlendi && sekme !== 'cop' ? 0.7 : 1,
                                    boxShadow: acik ? '0 4px 20px rgba(30,27,75,0.15)' : '0 1px 4px rgba(0,0,0,0.04)',
                                }}
                                onClick={() => mesajAc(m)}
                            >
                                {/* BAŞLIK SATIRI */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 5 }}>
                                            {/* MODEL KODU ROZETİ — en belirgin eleman */}
                                            {m.urun_kodu && (
                                                <span style={{
                                                    fontSize: '0.72rem', fontWeight: 900,
                                                    padding: '3px 10px', borderRadius: 6,
                                                    background: '#1e1b4b', color: '#a5b4fc',
                                                    letterSpacing: '0.08em', fontFamily: 'monospace',
                                                    border: '1px solid #3730a3',
                                                    display: 'flex', alignItems: 'center', gap: 4,
                                                }}>
                                                    📦 [{m.urun_kodu}]
                                                </span>
                                            )}
                                            <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '2px 7px', borderRadius: 4, background: renk.badge, color: 'white' }}>{renk.label}</span>
                                            <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '2px 7px', borderRadius: 4, background: '#f1f5f9', color: '#475569' }}>{TIP_LABEL[m.tip]}</span>
                                            {m.onay_durumu && <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '2px 7px', borderRadius: 4, background: ONAY_RENK[m.onay_durumu].bg, color: ONAY_RENK[m.onay_durumu].text }}>{ONAY_RENK[m.onay_durumu].label}</span>}
                                            {!okundu && <span style={{ fontSize: '0.6rem', fontWeight: 900, padding: '2px 7px', borderRadius: 4, background: '#ef4444', color: 'white' }}>🔴 OKUNMADI</span>}
                                            {/* Çöpteki mesajlar için etiket */}
                                            {gizlendi && sekme === 'cop' && (
                                                <span style={{ fontSize: '0.6rem', fontWeight: 900, padding: '2px 7px', borderRadius: 4, background: '#ef4444', color: 'white' }}>🗑️ ÇÖPTE (Silinecek: {formatTarih(new Date(new Date(m.cop_tarihi).getTime() + 45 * 24 * 60 * 60 * 1000).toISOString())})</span>
                                            )}
                                            {m.mesaj_hash && (
                                                <span style={{ fontSize: '0.58rem', fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: '#f0fdf4', color: '#166534', display: 'flex', alignItems: 'center', gap: 3 }}>
                                                    <Hash size={9} /> SHA-256
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontWeight: okundu ? 700 : 900, fontSize: '0.95rem', color: '#0f172a', marginBottom: 3 }}>{m.konu}</div>
                                        <div style={{ fontSize: '0.72rem', color: '#475569', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><User size={11} /> {m.gonderen_adi} ({m.gonderen_modul})</span>
                                            {m.alici_grup && <span>→ {m.alici_grup === 'hepsi' ? '📢 Herkes' : MODULLER.find(x => x.key === m.alici_grup)?.label || m.alici_grup}</span>}
                                            {/* TARİH + SAAT — her zaman belirgin */}
                                            <span style={{
                                                display: 'flex', alignItems: 'center', gap: 4,
                                                background: '#f1f5f9', borderRadius: 5,
                                                padding: '2px 8px', fontWeight: 800,
                                                color: '#334155', fontSize: '0.7rem',
                                            }}>
                                                <Clock size={11} />
                                                {formatTarih(m.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                        {/* GİZLE / ÇÖPE AT butonu */}
                                        {!gizlendi && (
                                            <button
                                                onClick={e => gizle(m, e)}
                                                title={
                                                    !silYetkisiVarMi(m)
                                                        ? `⛔ Yetki yok — Koordinatör/Sahibi`
                                                        : 'Görünümünden kaldır ve Çöpe At'
                                                }
                                                style={{
                                                    padding: '4px 8px',
                                                    background: !silYetkisiVarMi(m) ? '#f1f5f9' : '#fef2f2',
                                                    border: `1px solid ${!silYetkisiVarMi(m) ? '#cbd5e1' : '#fca5a5'}`,
                                                    color: !silYetkisiVarMi(m) ? '#94a3b8' : '#dc2626',
                                                    borderRadius: 6, cursor: !silYetkisiVarMi(m) ? 'not-allowed' : 'pointer',
                                                    fontSize: '0.65rem', fontWeight: 700,
                                                    display: 'flex', alignItems: 'center', gap: 3,
                                                }}
                                            >
                                                {!silYetkisiVarMi(m) ? <Lock size={11} /> : <Trash2 size={11} />}
                                            </button>
                                        )}
                                        {/* GERİ YÜKLE butonu - Sadece Çöpteyken ve Koordinatör */}
                                        {gizlendi && sekme === 'cop' && tamArsivYetkisi && (
                                            <button
                                                onClick={e => copeGeriAl(m, e)}
                                                title="Çöpten Geri Yükle"
                                                style={{
                                                    padding: '4px 8px',
                                                    background: '#ecfdf5',
                                                    border: `1px solid #6ee7b7`,
                                                    color: '#059669',
                                                    borderRadius: 6, cursor: 'pointer',
                                                    fontSize: '0.65rem', fontWeight: 700,
                                                    display: 'flex', alignItems: 'center', gap: 3,
                                                }}
                                            >
                                                <RefreshCcw size={11} /> Geri Yükle
                                            </button>
                                        )}
                                        <span style={{ color: '#94a3b8' }}>{acik ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
                                    </div>
                                </div>

                                {/* DETAY — Açık ise */}
                                {acik && (
                                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid #e5e7eb' }}>
                                        {m.ilgili_modul && (
                                            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '8px 12px', marginBottom: '0.875rem', fontSize: '0.78rem', color: '#0369a1', fontWeight: 700 }}>
                                                🔗 İlgili: {MODULLER.find(x => x.key === m.ilgili_modul)?.label || m.ilgili_modul}
                                                {m.ilgili_kayit_ozet && ` — ${m.ilgili_kayit_ozet}`}
                                            </div>
                                        )}

                                        {/* İçerik */}
                                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1rem', fontSize: '0.875rem', lineHeight: 1.7, color: '#1e293b', whiteSpace: 'pre-wrap', fontWeight: 500 }}>
                                            {m.icerik}
                                        </div>

                                        {/* SHA-256 Hash gösterimi — Arşiv + Yönetim */}
                                        {m.mesaj_hash && sekme === 'arsiv' && tamArsivYetkisi && (
                                            <div style={{ marginTop: '0.75rem', padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: '0.62rem', color: '#166534', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, wordBreak: 'break-all' }}>
                                                <Hash size={11} /> SHA-256: {m.mesaj_hash}
                                            </div>
                                        )}

                                        {/* Kanıt Damgaları */}
                                        <div style={{ marginTop: '0.875rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 7, padding: '5px 10px', fontSize: '0.65rem', color: '#166534', fontWeight: 700 }}>
                                                <CheckCircle2 size={11} /> Gönderildi: {formatTarih(m.created_at)}
                                            </div>
                                            {m.okundu_at
                                                ? <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 7, padding: '5px 10px', fontSize: '0.65rem', color: '#1d4ed8', fontWeight: 700 }}><Eye size={11} /> Okundu: {formatTarih(m.okundu_at)}</div>
                                                : <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, padding: '5px 10px', fontSize: '0.65rem', color: '#dc2626', fontWeight: 700 }}><EyeOff size={11} /> Henüz okunmadı</div>
                                            }
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 7, padding: '5px 10px', fontSize: '0.65rem', color: '#6d28d9', fontWeight: 700 }}>
                                                <Lock size={11} /> İçerik Kilitlenidir
                                            </div>
                                        </div>

                                        {/* Onay notu */}
                                        {m.onay_durumu && m.onay_durumu !== 'bekliyor' && (
                                            <div style={{ marginTop: '0.75rem', padding: '10px 14px', background: ONAY_RENK[m.onay_durumu].bg, borderRadius: 10, fontSize: '0.8rem', color: ONAY_RENK[m.onay_durumu].text, fontWeight: 700 }}>
                                                {ONAY_RENK[m.onay_durumu].label} — {m.onaylayan_adi} ({formatTarih(m.onaylandi_at)})
                                                {m.onay_notu && <div style={{ marginTop: 5, fontWeight: 600 }}>Not: {m.onay_notu}</div>}
                                            </div>
                                        )}

                                        {/* AKSİYON BUTONLAR */}
                                        <div style={{ marginTop: '1rem', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            {m.gonderen_id !== kullanici?.id && (
                                                <button onClick={e => { e.stopPropagation(); setYanitMod(!yanitMod); }}
                                                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: '#eff6ff', border: '1px solid #3b82f6', color: '#2563eb', borderRadius: 7, cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem' }}>
                                                    <Reply size={13} /> Yanıtla
                                                </button>
                                            )}
                                            {m.onay_durumu === 'bekliyor' && tamArsivYetkisi && (
                                                <>
                                                    <button onClick={e => { e.stopPropagation(); onayIslem(m.id, 'onaylandi'); }} style={{ padding: '7px 14px', background: '#dcfce7', border: '1px solid #22c55e', color: '#166534', borderRadius: 7, cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem' }}>✅ Onayla</button>
                                                    <button onClick={e => { e.stopPropagation(); onayIslem(m.id, 'reddedildi'); }} style={{ padding: '7px 14px', background: '#fee2e2', border: '1px solid #ef4444', color: '#991b1b', borderRadius: 7, cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem' }}>❌ Reddet</button>
                                                    <input value={onayNotu} onChange={e => setOnayNotu(e.target.value)} onClick={e => e.stopPropagation()} placeholder="Onay/Red notu..." style={{ ...inp, maxWidth: 220, padding: '6px 10px' }} />
                                                </>
                                            )}
                                        </div>

                                        {/* YANIT FORMU */}
                                        {yanitMod && (
                                            <div style={{ marginTop: '0.875rem', padding: '1rem', background: '#f8f7ff', border: '2px solid #1e1b4b', borderRadius: 12 }} onClick={e => e.stopPropagation()}>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e1b4b', marginBottom: 8 }}>✏️ Yanıtınız — SHA-256 damgalanır, değiştirilemez</div>
                                                <textarea rows={3} value={yanitIcerik} onChange={e => setYanitIcerik(e.target.value)} placeholder="Yanıtınızı yazın..." style={{ ...inp, resize: 'vertical' }} />
                                                <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                                                    <button onClick={() => setYanitMod(false)} style={{ padding: '7px 14px', border: '1px solid #e5e7eb', borderRadius: 7, background: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem' }}>İptal</button>
                                                    <button onClick={e => { e.stopPropagation(); yanitGonder(); }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 16px', background: '#1e1b4b', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 800, fontSize: '0.78rem' }}>
                                                        <Send size={13} /> Yanıtı Gönder
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
