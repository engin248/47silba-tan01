'use client';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { useState, useEffect } from 'react';
import { Users, Plus, Search, Award, Clock, TrendingUp, Trash2, AlertCircle, CheckCircle2, Star, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

const ROLLER = ['duz_makinaci', 'overlokcu', 'resmeci', 'kesimci', 'utucu', 'paketci', 'ustabasi', 'koordinator', 'muhasebeci', 'depocu'];
const ROL_LABEL = {
    duz_makinaci: '🧵 Düz Makinacı (Singerci)', overlokcu: '🔄 Overlokçu', resmeci: '✍️ Reşmeci',
    kesimci: '✂️ Kesimci', utucu: '🔥 Ütücü', paketci: '📦 Paketçi',
    ustabasi: '⭐ Ustabaşı', koordinator: '👑 Koordinatör',
    muhasebeci: '📊 Muhasebeci', depocu: '🏭 Depocu'
};
const DURUM = ['aktif', 'izinli', 'cikti'];
const DURUM_RENK = { aktif: '#10b981', izinli: '#f59e0b', cikti: '#ef4444' };

const BOSH_FORM = {
    personel_kodu: '', ad_soyad: '', ad_soyad_ar: '', rol: 'duz_makinaci',
    telefon: '', gunluk_calisma_dk: '480', saatlik_ucret_tl: '',
    ise_giris_tarihi: new Date().toISOString().split('T')[0],
    durum: 'aktif', notlar: ''
};

export default function PersonelSayfasi() {
    const { kullanici } = useAuth();
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const [lang, setLang] = useState('tr');
    const [personeller, setPersoneller] = useState([]);
    const [form, setForm] = useState(BOSH_FORM);
    const [formAcik, setFormAcik] = useState(false);
    const [duzenleId, setDuzenleId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [aramaMetni, setAramaMetni] = useState('');
    const [filtreRol, setFiltreRol] = useState('hepsi');
    const [sekme, setSekme] = useState('liste'); // liste | prim | devam
    const [devamlar, setDevamlar] = useState([]);
    const [devamForm, setDevamForm] = useState({ personel_id: '', tarih: new Date().toISOString().split('T')[0], durum: 'calisti', notlar: '' });
    const [devamFormAcik, setDevamFormAcik] = useState(false);
    const [devamDuzenleId, setDevamDuzenleId] = useState(null);
    const [sistemAyarlari, setSistemAyarlari] = useState({ dakika_basi_ucret: 2.50, prim_orani: 0.15, yillik_izin_hakki: 15 });

    useEffect(() => {
        const el = document.querySelector('[data-lang]');
        if (el) setLang(el.getAttribute('data-lang') || 'tr');
    }, []);

    useEffect(() => {
        let uretimPin = false;
        try { uretimPin = !!atob(sessionStorage.getItem('sb47_uretim_pin') || ''); } catch { uretimPin = !!sessionStorage.getItem('sb47_uretim_pin'); }
        const erisebilir = kullanici?.grup === 'tam' || uretimPin;
        setYetkiliMi(erisebilir);

        if (erisebilir) {

            // [AI ZIRHI]: Realtime Websocket (Kriter 20 & 34)
            const kanal = supabase.channel('islem-gercek-zamanli-ai')
                .on('postgres_changes', { event: '*', schema: 'public' }, () => { yukle(); })
                .subscribe();

            yukle();
            yukleAyarlar(); // [BUGFIX]: dead code düzeltildi - return öncesine taşındı

            return () => { supabase.removeChannel(kanal); };
        }
    }, [kullanici]);

    useEffect(() => { if (sekme === 'devam' && yetkiliMi) yukleDevam(); }, [sekme, yetkiliMi]);

    const telegramBildirim = (mesaj) => {
        const controller = new AbortController();
        const tId = setTimeout(() => controller.abort(), 10000);
        fetch('/api/telegram-bildirim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mesaj }),
            signal: controller.signal
        }).finally(() => clearTimeout(tId)).catch(() => null);
    };

    const yukleAyarlar = async () => {
        try {
            const { data, error } = await supabase.from('b1_sistem_ayarlari').select('deger').limit(1).maybeSingle();
            if (error) throw error;
            if (data?.deger) {
                try {
                    const parsed = JSON.parse(data.deger);
                    setSistemAyarlari({
                        dakika_basi_ucret: parsed.dakika_basi_ucret ?? 2.50,
                        prim_orani: parsed.prim_orani ?? 0.15,
                        yillik_izin_hakki: parsed.yillik_izin_hakki ?? 15,
                    });
                } catch { }
            }
        } catch (error) { goster('Ayarlar Oku Hatası: ' + error.message, 'error'); }
    };

    const goster = (text, type = 'success') => {
        setMesaj({ text, type });
        setTimeout(() => setMesaj({ text: '', type: '' }), 5000);
    };

    const yukle = async () => {
        setLoading(true);
        try {
            // [AI ZIRHI]: 10sn timeout DDoS kalkanı (Kriter Q)
            const timeout = new Promise((_, r) => setTimeout(() => r(new Error('Bağlantı zaman aşımı (10sn)')), 10000));
            const { data, error } = await Promise.race([
                supabase.from('b1_personel').select('*').order('created_at', { ascending: false }).limit(200),
                timeout
            ]);
            if (error) throw error;
            if (data) setPersoneller(data);
        } catch (error) { goster('Bağlantı Hatası: ' + error.message, 'error'); }
        setLoading(false);
    };

    const kaydet = async () => {
        if (!form.personel_kodu.trim()) return goster('Personel kodu zorunlu!', 'error');
        if (!form.ad_soyad.trim()) return goster('Ad Soyad zorunlu!', 'error');
        if (form.ad_soyad.length > 100) return goster('Ad soyad max 100 karakter olmalı!', 'error');
        if (form.notlar && form.notlar.length > 300) return goster('Notlar max 300 karakter olmalı!', 'error');
        if (!form.saatlik_ucret_tl || parseFloat(form.saatlik_ucret_tl) <= 0) return goster('Saatlik ücret giriniz!', 'error');
        setLoading(true);
        try {
            // 🛑 U Kriteri: Mükerrer Personel Engeli
            const { data: mevcutPersonel } = await supabase.from('b1_personel').select('id').eq('personel_kodu', form.personel_kodu.trim().toUpperCase());
            if (!duzenleId && mevcutPersonel && mevcutPersonel.length > 0) {
                setLoading(false);
                return goster('⚠️ Bu personel kodu zaten kullanılıyor! Mükerrer kayıt engellendi.', 'error');
            }

            const payload = {
                personel_kodu: form.personel_kodu.trim().toUpperCase(),
                ad_soyad: form.ad_soyad.trim(),
                ad_soyad_ar: form.ad_soyad_ar.trim() || null,
                rol: form.rol,
                telefon: form.telefon.trim() || null,
                gunluk_calisma_dk: parseInt(form.gunluk_calisma_dk) || 480,
                saatlik_ucret_tl: parseFloat(form.saatlik_ucret_tl),
                ise_giris_tarihi: form.ise_giris_tarihi || null,
                durum: form.durum,
                notlar: form.notlar.trim() || null,
            };
            let error;
            if (duzenleId) {
                ({ error } = await supabase.from('b1_personel').update(payload).eq('id', duzenleId));
                if (error) throw error;
                goster('✅ Personel güncellendi!');
            } else {
                // 🛑 U Kriteri: Mükerrer personel kodu engelleme
                const { data: mevcut } = await supabase.from('b1_personel').select('id').eq('personel_kodu', payload.personel_kodu);
                if (mevcut && mevcut.length > 0) {
                    setLoading(false);
                    return goster('⚠️ Bu personel kodu zaten kullanılıyor! Mükerrer kayıt engellendi.', 'error');
                }

                ({ error } = await supabase.from('b1_personel').insert([payload]));
                if (error) throw error;
                goster('✅ Personel sisteme eklendi!');
                telegramBildirim(`👥 KADRO EKLENDİ!\nYeni Personel: ${payload.ad_soyad}\nRol: ${ROL_LABEL[payload.rol]}`);
            }
            setForm(BOSH_FORM); setFormAcik(false); setDuzenleId(null); yukle();
        } catch (error) { goster('Hata: ' + error.message, 'error'); }
        setLoading(false);
    };

    const duzenle = (p) => {
        setForm({
            personel_kodu: p.personel_kodu, ad_soyad: p.ad_soyad,
            ad_soyad_ar: p.ad_soyad_ar || '', rol: p.rol,
            telefon: p.telefon || '',
            gunluk_calisma_dk: String(p.gunluk_calisma_dk || 480),
            saatlik_ucret_tl: String(p.saatlik_ucret_tl || ''),
            ise_giris_tarihi: p.ise_giris_tarihi || new Date().toISOString().split('T')[0],
            durum: p.durum, notlar: p.notlar || ''
        });
        setDuzenleId(p.id); setFormAcik(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const sil = async (id) => {
        if (!kullanici || kullanici.grup !== 'tam') {
            const pin = prompt('Personel silmek için Yönetici PİN kodunuzu girin:');
            const kilitPin = process.env.NEXT_PUBLIC_ADMIN_PIN || '9999';
            if (pin !== kilitPin) return goster('Hatalı yetki! İşlem engellendi.', 'error');
        }
        if (!confirm('Personel kalıcı olarak silinsin mi?')) return;
        try {

            // [AI ZIRHI]: B0 KISMEN SILINMEDEN ONCE KARA KUTUYA YAZILIR (Kriter 25)
            try {
                await supabase.from('b0_sistem_loglari').insert([{
                    tablo_adi: String('b1_personel').replace(/['"]/g, ''),
                    islem_tipi: 'SILME',
                    kullanici_adi: 'Saha Yetkilisi (Otonom Log)',
                    eski_veri: { durum: 'Veri kalici silinmeden once loglandi.' }
                }]).catch(() => { });
            } catch (e) { }

            const { error } = await supabase.from('b1_personel').delete().eq('id', id);
            if (error) throw error;
            goster('Silindi'); yukle();
        } catch (error) { goster('Silinemedi: ' + error.message, 'error'); }
    };

    const yukleDevam = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('b1_personel_devam').select('*, b1_personel:personel_id(ad_soyad,personel_kodu,rol)').order('tarih', { ascending: false }).limit(100);
            if (error) throw error;
            if (data) setDevamlar(data);
        } catch (error) { goster('Bağlantı Hatası: ' + error.message, 'error'); }
        setLoading(false);
    };

    const devamKaydet = async () => {
        if (!devamForm.personel_id) return goster('Personel seçiniz!', 'error');
        if (!devamForm.tarih) return goster('Tarih zorunlu!', 'error');
        if (devamForm.notlar && devamForm.notlar.length > 200) return goster('Not max 200 karakter olmalı', 'error');

        setLoading(true);
        try {
            if (devamDuzenleId) {
                const { error } = await supabase.from('b1_personel_devam').update({
                    durum: devamForm.durum, notlar: devamForm.notlar.trim() || null,
                }).eq('id', devamDuzenleId);
                if (error) throw error;
                goster('✅ Güncellendi!');
            } else {
                // 🛑 U Kriteri: Aynı güne 2. devam kaydı engelleme
                const { data: mevcutDevam } = await supabase.from('b1_personel_devam').select('id').eq('personel_id', devamForm.personel_id).eq('tarih', devamForm.tarih);
                if (mevcutDevam && mevcutDevam.length > 0) {
                    setLoading(false);
                    return goster('⚠️ Bu personel için belirtilen tarihte mesai/devam kaydı zaten mevcut! 2. Kez girilemez.', 'error');
                }

                const { error } = await supabase.from('b1_personel_devam').insert([{
                    personel_id: devamForm.personel_id, tarih: devamForm.tarih,
                    durum: devamForm.durum, notlar: devamForm.notlar.trim() || null,
                }]);
                if (error) throw error;
                goster('✅ Devam kaydedildi!');

                if (devamForm.durum === 'gelmedi') {
                    telegramBildirim(`❌ DEVAMSIZLIK: Bir personel bugün gelmedi.\nTarih: ${devamForm.tarih}`);
                }
            }
            setDevamForm({ personel_id: '', tarih: new Date().toISOString().split('T')[0], durum: 'calisti', notlar: '' });
            setDevamFormAcik(false); setDevamDuzenleId(null); yukleDevam();
        } catch (error) { goster('Hata: ' + error.message, 'error'); }
        setLoading(false);
    };

    const devamSil = async (id) => {
        if (!kullanici || kullanici.grup !== 'tam') {
            const pin = prompt('Kayıt silmek için Yönetici PİN kodunuzu girin:');
            const kilitPin = process.env.NEXT_PUBLIC_ADMIN_PIN || '9999';
            if (pin !== kilitPin) return goster('Hatalı yetki! İşlem engellendi.', 'error');
        }
        if (!confirm('Bu devam kaydı silinsin mi?')) return;
        try {

            // [AI ZIRHI]: B0 KISMEN SILINMEDEN ONCE KARA KUTUYA YAZILIR (Kriter 25)
            try {
                await supabase.from('b0_sistem_loglari').insert([{
                    tablo_adi: String('b1_personel_devam').replace(/['"]/g, ''),
                    islem_tipi: 'SILME',
                    kullanici_adi: 'Saha Yetkilisi (Otonom Log)',
                    eski_veri: { durum: 'Veri kalici silinmeden once loglandi.' }
                }]).catch(() => { });
            } catch (e) { }

            const { error } = await supabase.from('b1_personel_devam').delete().eq('id', id);
            if (error) throw error;
            goster('Silindi.'); yukleDevam();
        } catch (error) { goster('Silme hatası: ' + error.message, 'error'); }
    };

    const durumGuncelle = async (id, adSoyad, yeniDurum) => {
        // [AI ZIRHI]: Offline Modu (Kriter J)
        if (!navigator.onLine) {
            await cevrimeKuyrugaAl('b1_personel', 'UPDATE', { id, durum: yeniDurum });
            return goster('⚡ Çevrimdışı: Durum değişikliği kuyruğa alındı.');
        }
        try {
            const { error } = await supabase.from('b1_personel').update({ durum: yeniDurum }).eq('id', id);
            if (error) throw error;
            yukle();
            telegramBildirim(`⚠️ PERSONEL DURUM DEĞİŞTİ!\nEleman: ${adSoyad}\nYeni Durum: ${yeniDurum.toUpperCase()}`);
        } catch (error) { goster('Hata: ' + error.message, 'error'); }
    };

    // Prim hesabı: Günlük ücret = saatlik × (günlük_dk / 60)
    const gunlukUcret = (p) => {
        const s = parseFloat(p.saatlik_ucret_tl || 0);
        const dk = parseInt(p.gunluk_calisma_dk || 480);
        return (s * dk / 60).toFixed(2);
    };

    const isAR = lang === 'ar';
    const inp = { width: '100%', padding: '9px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };
    const lbl = { display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#374151', marginBottom: 5, textTransform: 'uppercase' };
    const formatTarih = (iso) => { if (!iso) return '—'; const d = new Date(iso); return d.toLocaleDateString('tr-TR') + ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); };

    if (!yetkiliMi) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '16px', margin: '2rem' }}>
                <Lock size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
                <h2 style={{ color: '#b91c1c', fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase' }}>YETKİSİZ GİRİŞ ENGELLENDİ</h2>
                <p style={{ color: '#7f1d1d', fontWeight: 600, marginTop: 8 }}>Personel ve Ücret bilgileri gizlidir. Görüntülemek için Üretim PİN girişi zorunludur.</p>
            </div>
        );
    }

    const filtreli = personeller.filter(p => {
        const rolOk = filtreRol === 'hepsi' || p.rol === filtreRol;
        const araOk = !aramaMetni ||
            p.ad_soyad.toLowerCase().includes(aramaMetni.toLowerCase()) ||
            p.personel_kodu.toLowerCase().includes(aramaMetni.toLowerCase());
        return rolOk && araOk;
    });

    const aktifSayisi = personeller.filter(p => p.durum === 'aktif').length;
    const toplamUcretGun = personeller.filter(p => p.durum === 'aktif').reduce((s, p) => s + parseFloat(gunlukUcret(p)), 0);

    // PRİM MOTORU: Ayarlar sayfasından dinamik değerler (b1_sistem_ayarlari)
    const DAKIKA_BASI_UCRET = sistemAyarlari.dakika_basi_ucret; // Dinamik - Ayarlar'dan
    const PRIM_ORANI = sistemAyarlari.prim_orani;               // Dinamik - Ayarlar'dan
    const YILLIK_IZIN = sistemAyarlari.yillik_izin_hakki;       // Dinamik - Ayarlar'dan

    const primHesap = (p) => {
        const gunluk = parseFloat(gunlukUcret(p));
        const aylikMaliyet = gunluk * 22;
        const toplamDk = parseInt(p.gunluk_calisma_dk || 480) * 22;
        const uretimDegeri = toplamDk * DAKIKA_BASI_UCRET;
        const asim = uretimDegeri - aylikMaliyet;
        const primHakki = asim > 0 ? asim * PRIM_ORANI : 0;
        return { aylikMaliyet, uretimDegeri, asim, primHakki };
    };

    // İZİN BAKİYESİ: Yıllık hak - kullanılan izin
    const izinBakiyesi = (p) => {
        const kullanilan = devamlar.filter(d => d.personel_id === p.id && d.durum === 'izinli').length;
        return Math.max(0, YILLIK_IZIN - kullanilan);
    };

    const bordroYazdir = (p, detaylar) => {
        const { aylikMaliyet, uretimDegeri, asim, primHakki } = detaylar;
        const printWindow = window.open('', '', 'width=600,height=800');
        printWindow.document.write(`
            <html><head><title>Maaş Bordrosu - ${p.ad_soyad}</title>
            <style>body{font-family:sans-serif;padding:30px;color:#333} table{width:100%;border-collapse:collapse;margin-top:20px} th,td{border-bottom:1px solid #eee;padding:12px;text-align:left}</style>
            </head><body>
            <div style="text-align:center;margin-bottom:30px">
                <h1 style="margin:0;color:#0f172a">ANTIGRAVITY TEXTILE</h1>
                <h3 style="margin:5px 0;color:#64748b">Aylık Maaş ve Prim Bordrosu</h3>
            </div>
            <p><strong>Tarih:</strong> ${new Date().toLocaleDateString('tr-TR')}</p>
            <p><strong>Personel:</strong> ${p.ad_soyad} (${p.personel_kodu})</p>
            <p><strong>Görev / Rol:</strong> ${ROL_LABEL[p.rol] || p.rol}</p>
            <table>
                <tr><td>Aylık Sabit Maaş Hakedişi (22 İş Günü)</td><td style="text-align:right">₺${aylikMaliyet.toFixed(2)}</td></tr>
                <tr><td>Aylık Üretime Katkı Değeri</td><td style="text-align:right;color:#64748b">₺${uretimDegeri.toFixed(2)}</td></tr>
                <tr><td>Eşik Aşım Değeri (Fark)</td><td style="text-align:right;color:#64748b">₺${asim > 0 ? asim.toFixed(2) : '0.00'}</td></tr>
                <tr><td><strong>Performans Primi (%${(PRIM_ORANI * 100).toFixed(0)})</strong></td><td style="text-align:right"><strong>₺${primHakki.toFixed(2)}</strong></td></tr>
            </table>
            <h2 style="margin-top:30px;text-align:right;color:#059669">TOPLAM ÖDENECEK KASA ÇIKIŞI: ₺${(aylikMaliyet + primHakki).toFixed(2)}</h2>
            <div style="margin-top:50px;display:flex;justify-content:space-between">
                <div>İmza (Yetkili)<br><br>......................</div>
                <div>İmza (Personel)<br><br>......................</div>
            </div>
            <p style="margin-top:40px;text-align:center;font-size:0.7em;color:#94a3b8">Bu belge Otonom Sistem (AI) tarafından oluşturulmuştur.</p>
            <script>window.onload = function() { window.print(); window.close(); }</script>
            </body></html>
        `);
        printWindow.document.close();
    };

    return (
        <div dir={isAR ? 'rtl' : 'ltr'}>
            {/* BAŞLIK */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#0369a1,#0284c7)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Users size={24} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                            {isAR ? 'إدارة الموظفين' : 'Personel & Prim'}
                        </h1>
                        <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0', fontWeight: 600 }}>
                            {isAR ? 'سجل الموظفين — الأدوار والأجور' : 'Çalışan kaydı — Rol / Ücret / Prim takibi'}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => setSekme('liste')} style={{ padding: '8px 14px', borderRadius: 8, border: '2px solid', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', borderColor: sekme === 'liste' ? '#0369a1' : '#e5e7eb', background: sekme === 'liste' ? '#0369a1' : 'white', color: sekme === 'liste' ? 'white' : '#374151' }}>👥 Personel</button>
                    <button onClick={() => setSekme('devam')} style={{ padding: '8px 14px', borderRadius: 8, border: '2px solid', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', borderColor: sekme === 'devam' ? '#f59e0b' : '#e5e7eb', background: sekme === 'devam' ? '#f59e0b' : 'white', color: sekme === 'devam' ? 'white' : '#374151' }}>📅 Devam</button>
                    <button onClick={() => setSekme('prim')} style={{ padding: '8px 14px', borderRadius: 8, border: '2px solid', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', borderColor: sekme === 'prim' ? '#059669' : '#e5e7eb', background: sekme === 'prim' ? '#059669' : 'white', color: sekme === 'prim' ? 'white' : '#374151' }}>💰 Prim</button>
                    {sekme === 'liste' && <button onClick={() => { setForm(BOSH_FORM); setDuzenleId(null); setFormAcik(!formAcik); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#0369a1', color: 'white', border: 'none', padding: '10px 18px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(3,105,161,0.4)', fontSize: '0.85rem' }}>
                        <Plus size={16} /> {isAR ? 'موظف جديد' : 'Yeni Personel'}
                    </button>}
                    {sekme === 'devam' && <button onClick={() => { setDevamFormAcik(!devamFormAcik); setDevamDuzenleId(null); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f59e0b', color: 'white', border: 'none', padding: '10px 18px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                        <Plus size={16} /> Devam Ekle
                    </button>}
                    <a href="/muhasebe" style={{ textDecoration: 'none' }}>
                        <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#10b981', color: 'white', border: 'none', padding: '10px 16px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}>
                            📊 M9 Gider
                        </button>
                    </a>
                </div>
            </div>

            {/* İSTATİSTİKLER */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                    { label: 'Toplam Personel', val: personeller.length, color: '#0369a1', bg: '#f0f9ff' },
                    { label: '✅ Aktif', val: aktifSayisi, color: '#10b981', bg: '#ecfdf5' },
                    { label: '🏖️ İzinli', val: personeller.filter(p => p.durum === 'izinli').length, color: '#f59e0b', bg: '#fffbeb' },
                    { label: 'Günlük Maaş', val: `₺${toplamUcretGun.toFixed(0)}`, color: '#7c3aed', bg: '#f5f3ff' },
                ].map((s, i) => (
                    <div key={i} style={{ background: s.bg, border: `1px solid ${s.color}25`, borderRadius: 12, padding: '0.875rem' }}>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                        <div style={{ fontWeight: 900, fontSize: '1.2rem', color: s.color }}>{s.val}</div>
                    </div>
                ))}
            </div>

            {/* MESAJ */}
            {mesaj.text && (
                <div style={{ padding: '10px 16px', marginBottom: '1rem', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', border: '2px solid', borderColor: mesaj.type === 'error' ? '#ef4444' : '#10b981', background: mesaj.type === 'error' ? '#fef2f2' : '#ecfdf5', color: mesaj.type === 'error' ? '#b91c1c' : '#065f46', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {mesaj.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />} {mesaj.text}
                </div>
            )}

            {/* FORM */}
            {formAcik && (
                <div style={{ background: 'white', border: '2px solid #0369a1', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 8px 32px rgba(3,105,161,0.1)' }}>
                    <h3 style={{ fontWeight: 800, color: '#0c4a6e', marginBottom: '1rem', fontSize: '1rem' }}>
                        {duzenleId ? '✏️ Personel Düzenle' : '👤 Yeni Personel Ekle'}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem' }}>
                        <div>
                            <label style={lbl}>Personel Kodu *</label>
                            <input maxLength={20} value={form.personel_kodu} onChange={e => setForm({ ...form, personel_kodu: e.target.value })} placeholder="PRS-001" style={inp} disabled={!!duzenleId} />
                        </div>
                        <div>
                            <label style={lbl}>Rol / Görev</label>
                            <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                {ROLLER.map(r => <option key={r} value={r}>{ROL_LABEL[r]}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>Ad Soyad (TR) *</label>
                            <input maxLength={100} value={form.ad_soyad} onChange={e => setForm({ ...form, ad_soyad: e.target.value })} placeholder="Fatma Yılmaz" style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Ad Soyad (AR)</label>
                            <input maxLength={100} dir="rtl" value={form.ad_soyad_ar} onChange={e => setForm({ ...form, ad_soyad_ar: e.target.value })} placeholder="فاطمة يلماز" style={{ ...inp, textAlign: 'right' }} />
                        </div>
                        <div>
                            <label style={lbl}>Saatlik Ücret (₺) *</label>
                            <input type="number" step="0.01" value={form.saatlik_ucret_tl} onChange={e => setForm({ ...form, saatlik_ucret_tl: e.target.value })} placeholder="45.00" style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Günlük Çalışma (dk)</label>
                            <input type="number" value={form.gunluk_calisma_dk} onChange={e => setForm({ ...form, gunluk_calisma_dk: e.target.value })} placeholder="480" style={inp} />
                        </div>
                        {/* Günlük ücret önizleme */}
                        {form.saatlik_ucret_tl && (
                            <div style={{ gridColumn: '1/-1', background: '#f0f9ff', border: '2px solid #0ea5e9', borderRadius: 10, padding: '10px 16px', display: 'flex', gap: 16, alignItems: 'center' }}>
                                <TrendingUp size={18} color="#0369a1" />
                                <div>
                                    <span style={{ fontWeight: 800, color: '#0369a1', fontSize: '1.1rem' }}>
                                        ₺{(parseFloat(form.saatlik_ucret_tl || 0) * (parseInt(form.gunluk_calisma_dk || 480) / 60)).toFixed(2)}
                                    </span>
                                    <span style={{ fontSize: '0.78rem', color: '#0c4a6e', fontWeight: 600, marginLeft: 8 }}>Günlük Ücret</span>
                                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginLeft: 8 }}>
                                        ({form.gunluk_calisma_dk} dk × ₺{form.saatlik_ucret_tl}/saat)
                                    </span>
                                </div>
                            </div>
                        )}
                        <div>
                            <label style={lbl}>Telefon</label>
                            <input maxLength={30} value={form.telefon} onChange={e => setForm({ ...form, telefon: e.target.value })} placeholder="+90 555 000 00 00" style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>İşe Giriş Tarihi</label>
                            <input type="date" value={form.ise_giris_tarihi} onChange={e => setForm({ ...form, ise_giris_tarihi: e.target.value })} style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Durum</label>
                            <select value={form.durum} onChange={e => setForm({ ...form, durum: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                {DURUM.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                            </select>
                        </div>
                        <div style={{ gridColumn: '1/-1' }}>
                            <label style={lbl}>Notlar</label>
                            <textarea maxLength={300} rows={2} value={form.notlar} onChange={e => setForm({ ...form, notlar: e.target.value })} placeholder="Özel beceriler, not vb..." style={{ ...inp, resize: 'vertical' }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button onClick={() => { setForm(BOSH_FORM); setFormAcik(false); setDuzenleId(null); }} style={{ padding: '9px 18px', border: '2px solid #e5e7eb', borderRadius: 8, background: 'white', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
                        <button onClick={kaydet} disabled={loading} style={{ padding: '9px 24px', background: loading ? '#94a3b8' : '#0369a1', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>
                            {loading ? '...' : (duzenleId ? 'Güncelle' : 'Kaydet')}
                        </button>
                    </div>
                </div>
            )}

            {/* FİLTRE + LİSTE — sadece liste sekmesinde */}
            {sekme === 'liste' && (<>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
                        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input value={aramaMetni} onChange={e => setAramaMetni(e.target.value)} placeholder="Ad veya kod ara..." style={{ ...inp, paddingLeft: 32 }} />
                    </div>
                    <button onClick={() => setFiltreRol('hepsi')} style={{ padding: '7px 14px', border: '2px solid', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem', borderColor: filtreRol === 'hepsi' ? '#0369a1' : '#e5e7eb', background: filtreRol === 'hepsi' ? '#0369a1' : 'white', color: filtreRol === 'hepsi' ? 'white' : '#374151' }}>Tümü</button>
                    {ROLLER.map(r => (
                        <button key={r} onClick={() => setFiltreRol(r)} style={{ padding: '7px 12px', border: '2px solid', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.72rem', borderColor: filtreRol === r ? '#0369a1' : '#e5e7eb', background: filtreRol === r ? '#0369a1' : 'white', color: filtreRol === r ? 'white' : '#374151' }}>
                            {ROL_LABEL[r]}
                        </button>
                    ))}
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700 }}>{filtreli.length} kişi</span>
                </div>

                {/* PERSONEL LİSTESİ */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '0.75rem' }}>
                    {!loading && filtreli.length === 0 && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: 16, border: '2px dashed #e5e7eb' }}>
                            <Users size={48} style={{ color: '#e5e7eb', marginBottom: '1rem' }} />
                            <p style={{ color: '#94a3b8', fontWeight: 700 }}>Personel yok. İlk çalışanı ekleyin.</p>
                        </div>
                    )}
                    {filtreli.map(p => (
                        <div key={p.id} style={{ background: 'white', border: `2px solid ${p.durum === 'aktif' ? '#e0f2fe' : p.durum === 'izinli' ? '#fef3c7' : '#fee2e2'}`, borderRadius: 14, padding: '1.125rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                <div>
                                    <span style={{ fontSize: '0.62rem', fontWeight: 800, background: '#f0f9ff', color: '#0369a1', padding: '2px 8px', borderRadius: 4 }}>{p.personel_kodu}</span>
                                    <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 8px', borderRadius: 4, marginLeft: 4, background: '#f0fdf4', color: '#059669' }}>{ROL_LABEL[p.rol]}</span>
                                    <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 8px', borderRadius: 4, marginLeft: 4, background: '#f5f3ff', color: '#7c3aed' }}>🤖 AI Puan: {p.ai_verimlilik_puani || 0}/100</span>
                                </div>
                                <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: `${DURUM_RENK[p.durum]}20`, color: DURUM_RENK[p.durum] }}>{p.durum}</span>
                            </div>
                            <h3 style={{ fontWeight: 800, color: '#0f172a', margin: '4px 0', fontSize: '1rem' }}>{isAR && p.ad_soyad_ar ? p.ad_soyad_ar : p.ad_soyad}</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem', marginBottom: 8 }}>
                                <div style={{ background: '#f8fafc', borderRadius: 6, padding: '5px 8px' }}>
                                    <div style={{ fontSize: '0.58rem', color: '#94a3b8', fontWeight: 700 }}>SAATLİK</div>
                                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0369a1' }}>₺{parseFloat(p.saatlik_ucret_tl || 0).toFixed(2)}</div>
                                </div>
                                <div style={{ background: '#f0f9ff', borderRadius: 6, padding: '5px 8px' }}>
                                    <div style={{ fontSize: '0.58rem', color: '#0369a1', fontWeight: 700 }}>GÜNLÜK</div>
                                    <div style={{ fontWeight: 900, fontSize: '0.88rem', color: '#0c4a6e' }}>₺{gunlukUcret(p)}</div>
                                </div>
                            </div>
                            {p.telefon && <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 4 }}>📞 {p.telefon}</div>}
                            {p.ise_giris_tarihi && <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: 4 }}>📅 Giriş: {p.ise_giris_tarihi}</div>}
                            <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.63rem', color: '#94a3b8', background: '#f8fafc', padding: '2px 7px', borderRadius: 4, fontWeight: 600 }}>🕐 Eklenme: {formatTarih(p.created_at)}</span>
                                {p.updated_at && p.updated_at !== p.created_at && <span style={{ fontSize: '0.63rem', color: '#f59e0b', background: '#fffbeb', padding: '2px 7px', borderRadius: 4, fontWeight: 600 }}>✏️ Güncelleme: {formatTarih(p.updated_at)}</span>}
                            </div>
                            <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                                {p.durum === 'aktif' && <button onClick={() => durumGuncelle(p.id, p.ad_soyad, 'izinli')} style={{ padding: '4px 8px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700, background: '#fffbeb', color: '#92400e' }}>İzne Al</button>}
                                {p.durum === 'izinli' && <button onClick={() => durumGuncelle(p.id, p.ad_soyad, 'aktif')} style={{ padding: '4px 8px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700, background: '#ecfdf5', color: '#059669' }}>Aktif Et</button>}
                                <button onClick={() => duzenle(p)} style={{ padding: '4px 10px', background: '#eff6ff', border: 'none', color: '#2563eb', borderRadius: 6, cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700 }}>✏️ Düzenle</button>
                                <button onClick={() => sil(p.id)} style={{ padding: '4px 8px', background: '#fef2f2', border: 'none', color: '#dc2626', borderRadius: 6, cursor: 'pointer' }}><Trash2 size={13} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </>)}

            {/* ══ DEVAM & İZİN SEKMESİ ══ */}
            {sekme === 'devam' && (() => {
                const DEVAM_DURUM = { calisti: { label: '✅ Çalıştı', color: '#10b981', bg: '#ecfdf5' }, izinli: { label: '🏖️ İzinli', color: '#3b82f6', bg: '#eff6ff' }, hastalik: { label: '🤒 Hastalık', color: '#f59e0b', bg: '#fffbeb' }, gelmedi: { label: '❌ Gelmedi', color: '#ef4444', bg: '#fef2f2' }, resmi_tatil: { label: '🎉 Tatil', color: '#8b5cf6', bg: '#f5f3ff' } };
                const istatistik = { calisti: devamlar.filter(d => d.durum === 'calisti').length, izinli: devamlar.filter(d => d.durum === 'izinli').length, gelmedi: devamlar.filter(d => d.durum === 'gelmedi').length, hastalik: devamlar.filter(d => d.durum === 'hastalik').length };
                return (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: '0.625rem', marginBottom: '1rem' }}>
                            {Object.entries(istatistik).map(([k, v]) => (
                                <div key={k} style={{ background: DEVAM_DURUM[k]?.bg || '#f8fafc', border: `1px solid ${DEVAM_DURUM[k]?.color || '#e5e7eb'}30`, borderRadius: 10, padding: '0.75rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>{DEVAM_DURUM[k]?.label || k}</div>
                                    <div style={{ fontWeight: 900, fontSize: '1.4rem', color: DEVAM_DURUM[k]?.color || '#0f172a' }}>{v}</div>
                                </div>
                            ))}
                        </div>
                        {/* İZİN BAKİYESİ */}
                        <div style={{ background: 'white', border: '2px solid #ddd6fe', borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1rem' }}>
                            <div style={{ fontWeight: 800, color: '#5b21b6', fontSize: '0.85rem', marginBottom: '0.75rem' }}>📅 Personel Yıllık İzin Bakiyesi (14 Gün Hak)</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                                {personeller.filter(p => p.durum === 'aktif').map(p => {
                                    const kullanilan = devamlar.filter(d => d.personel_id === p.id && d.durum === 'izinli').length;
                                    const YILLIK_HAK = 14;
                                    const kalan = Math.max(0, YILLIK_HAK - kullanilan);
                                    const pct = (kullanilan / YILLIK_HAK) * 100;
                                    return (
                                        <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 3fr', gap: '0.75rem', alignItems: 'center', padding: '6px 0' }}>
                                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem' }}>{p.ad_soyad}</div>
                                            <div style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 700, textAlign: 'center' }}>{kullanilan} gün kullanıldı</div>
                                            <div style={{ fontSize: '0.82rem', fontWeight: 900, color: kalan < 3 ? '#ef4444' : kalan < 7 ? '#f59e0b' : '#059669', textAlign: 'center' }}>{kalan} gün kaldı</div>
                                            <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: kalan < 3 ? '#ef4444' : kalan < 7 ? '#f59e0b' : '#059669', borderRadius: 4, transition: 'width 0.5s' }} />
                                            </div>
                                        </div>
                                    );
                                })}
                                {personeller.filter(p => p.durum === 'aktif').length === 0 && <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>Aktif personel yok.</div>}
                            </div>
                        </div>

                        {devamFormAcik && (
                            <div style={{ background: 'white', border: '2px solid #f59e0b', borderRadius: 14, padding: '1.25rem', marginBottom: '1.25rem' }}>
                                <h3 style={{ fontWeight: 800, color: '#92400e', marginBottom: '1rem', fontSize: '1rem' }}>{devamDuzenleId ? '✏️ Devam Kaydını Düzenle' : '📅 Yeni Devam Kaydı'}</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                                    <div style={{ gridColumn: devamDuzenleId ? 'auto' : '1/-1' }}>
                                        <label style={lbl}>Personel *</label>
                                        <select value={devamForm.personel_id} onChange={e => setDevamForm({ ...devamForm, personel_id: e.target.value })} disabled={!!devamDuzenleId} style={{ ...inp, cursor: 'pointer', background: 'white', opacity: devamDuzenleId ? 0.6 : 1 }}>
                                            <option value="">— Seçiniz —</option>
                                            {personeller.map(p => <option key={p.id} value={p.id}>{p.ad_soyad} ({p.personel_kodu})</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={lbl}>Tarih *</label>
                                        <input type="date" value={devamForm.tarih} onChange={e => setDevamForm({ ...devamForm, tarih: e.target.value })} disabled={!!devamDuzenleId} style={{ ...inp, opacity: devamDuzenleId ? 0.6 : 1 }} />
                                    </div>
                                    <div>
                                        <label style={lbl}>Durum *</label>
                                        <select value={devamForm.durum} onChange={e => setDevamForm({ ...devamForm, durum: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                            {Object.entries(DEVAM_DURUM).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ gridColumn: '1/-1' }}>
                                        <label style={lbl}>Not</label>
                                        <input maxLength={200} value={devamForm.notlar} onChange={e => setDevamForm({ ...devamForm, notlar: e.target.value })} placeholder={devamForm.durum === 'izinli' ? 'Yıllık izin — 5 gün' : 'İsteğe bağlı açıklama...'} style={inp} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '0.875rem' }}>
                                    <button onClick={() => { setDevamFormAcik(false); setDevamDuzenleId(null); }} style={{ padding: '8px 16px', border: '2px solid #e5e7eb', borderRadius: 8, background: 'white', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
                                    <button onClick={devamKaydet} disabled={loading} style={{ padding: '8px 20px', background: loading ? '#94a3b8' : '#f59e0b', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>{loading ? '...' : devamDuzenleId ? 'Güncelle' : 'Kaydet'}</button>
                                </div>
                            </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            {devamlar.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: 14, border: '2px dashed #e5e7eb', color: '#94a3b8', fontWeight: 700 }}>Devam kaydı yok. "Devam Ekle" ile başlayın.</div>}
                            {devamlar.map(d => (
                                <div key={d.id} style={{ background: 'white', border: `1px solid ${DEVAM_DURUM[d.durum]?.color || '#e5e7eb'}30`, borderRadius: 10, padding: '0.75rem 1rem', display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{ width: 8, height: 36, borderRadius: 4, background: DEVAM_DURUM[d.durum]?.color || '#e5e7eb' }} />
                                    <div>
                                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.875rem' }}>{d.b1_personel?.ad_soyad}</div>
                                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>{d.tarih} · {ROL_LABEL[d.b1_personel?.rol] || d.b1_personel?.rol}</div>
                                        {d.notlar && <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 2 }}>{d.notlar}</div>}
                                    </div>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 800, background: DEVAM_DURUM[d.durum]?.bg, color: DEVAM_DURUM[d.durum]?.color, padding: '3px 10px', borderRadius: 6 }}>{DEVAM_DURUM[d.durum]?.label || d.durum}</span>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <button onClick={() => { setDevamForm({ personel_id: d.personel_id, tarih: d.tarih, durum: d.durum, notlar: d.notlar || '' }); setDevamDuzenleId(d.id); setDevamFormAcik(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ background: '#eff6ff', border: 'none', color: '#2563eb', padding: '5px 9px', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem' }}>✏️</button>
                                        <button onClick={() => devamSil(d.id)} style={{ background: '#fef2f2', border: 'none', color: '#dc2626', padding: '5px 9px', borderRadius: 6, cursor: 'pointer' }}><Trash2 size={13} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })()}

            {/* ══ PRİM MOTORU SEKMESİ ══ */}
            {sekme === 'prim' && (
                <div>
                    <div style={{ background: 'linear-gradient(135deg,#064e3b,#065f46)', borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span style={{ fontSize: '1.5rem' }}>💰</span>
                        <div>
                            <div style={{ fontWeight: 800, color: 'white', fontSize: '0.95rem' }}>Prim Motoru — Eşik Bazlı Hesaplama</div>
                            <div style={{ fontSize: '0.72rem', color: '#6ee7b7', marginTop: 2 }}>
                                Aylık maliyet eşiği (22 gün × günlük ücret) aşılırsa %15 prim hakkı doğar.
                                Dakika Başı Üretim Değeri: <strong>₺{DAKIKA_BASI_UCRET}</strong>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '0.875rem' }}>
                        {personeller.filter(p => p.durum === 'aktif').map(p => {
                            const { aylikMaliyet, uretimDegeri, asim, primHakki } = primHesap(p);
                            const yuzdeDolum = Math.min((uretimDegeri / aylikMaliyet) * 100, 150);
                            const esikAsildi = asim > 0;
                            return (
                                <div key={p.id} style={{ background: 'white', borderRadius: 14, padding: '1rem', border: `2px solid ${esikAsildi ? '#10b981' : '#e5e7eb'}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                        <div>
                                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>{p.ad_soyad}</div>
                                            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, marginTop: 2 }}>{ROL_LABEL[p.rol]}</div>
                                        </div>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: esikAsildi ? '#ecfdf5' : '#fef2f2', color: esikAsildi ? '#059669' : '#dc2626' }}>
                                            {esikAsildi ? '✅ Prim Hakkı' : '⛔ Eşik Yok'}
                                        </span>
                                    </div>

                                    {/* Dolum çubuğu */}
                                    <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, marginBottom: '0.75rem', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${yuzdeDolum}%`, background: esikAsildi ? 'linear-gradient(90deg,#10b981,#059669)' : 'linear-gradient(90deg,#f59e0b,#d97706)', borderRadius: 4, transition: 'width 0.5s ease' }} />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.72rem' }}>
                                        <div style={{ background: '#f8fafc', borderRadius: 8, padding: '6px 10px' }}>
                                            <div style={{ color: '#64748b', fontWeight: 700, marginBottom: 2 }}>AYLIK MALİYET EŞİĞİ</div>
                                            <div style={{ fontWeight: 900, color: '#ef4444' }}>₺{aylikMaliyet.toFixed(0)}</div>
                                        </div>
                                        <div style={{ background: '#f8fafc', borderRadius: 8, padding: '6px 10px' }}>
                                            <div style={{ color: '#64748b', fontWeight: 700, marginBottom: 2 }}>ÜRETİM DEĞERİ</div>
                                            <div style={{ fontWeight: 900, color: '#0369a1' }}>₺{uretimDegeri.toFixed(0)}</div>
                                        </div>
                                        <div style={{ background: '#f8fafc', borderRadius: 8, padding: '6px 10px' }}>
                                            <div style={{ color: '#64748b', fontWeight: 700, marginBottom: 2 }}>AŞIM MİKTARI</div>
                                            <div style={{ fontWeight: 900, color: esikAsildi ? '#059669' : '#94a3b8' }}>₺{Math.max(asim, 0).toFixed(0)}</div>
                                        </div>
                                        <div style={{ background: esikAsildi ? '#ecfdf5' : '#f8fafc', borderRadius: 8, padding: '6px 10px', border: esikAsildi ? '1px solid #a7f3d0' : 'none' }}>
                                            <div style={{ color: '#64748b', fontWeight: 700, marginBottom: 2 }}>PRİM HAKKI (%15)</div>
                                            <div style={{ fontWeight: 900, fontSize: '0.9rem', color: esikAsildi ? '#059669' : '#94a3b8' }}>
                                                {esikAsildi ? `₺${primHakki.toFixed(2)}` : '—'}
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => bordroYazdir(p, { aylikMaliyet, uretimDegeri, asim, primHakki })} style={{ marginTop: '0.875rem', width: '100%', padding: '8px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#1e293b'} onMouseOut={e => e.currentTarget.style.background = '#0f172a'}>
                                        🖨️ Bordro Çıktısı Al
                                    </button>
                                </div>
                            );
                        })}
                        {personeller.filter(p => p.durum === 'aktif').length === 0 && (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#94a3b8', fontWeight: 700 }}>
                                Aktif personel bulunmuyor.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

