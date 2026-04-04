export const faturaYazdir = (siparis) => {
    if (!siparis) return;
    const kalemler = siparis.kalemler || [];
    const tarih = new Date().toLocaleDateString('tr-TR');
    const musteriAdi = siparis.b2_musteriler?.ad_soyad || 'Müşteri';

    const satirlar = kalemler.map(k => {
        const net = parseFloat(k.birim_fiyat_tl || 0) * parseInt(k.adet || 1) * (1 - (k.iskonto_pct || 0) / 100);
        return `<tr style="border-bottom:1px solid #eee">
            <td style="padding:8px">${k.b2_urun_katalogu?.urun_kodu || '—'}</td>
            <td style="padding:8px">${k.b2_urun_katalogu?.urun_adi || '—'}</td>
            <td style="padding:8px;text-align:center">${k.beden || '—'}</td>
            <td style="padding:8px;text-align:center">${k.adet}</td>
            <td style="padding:8px;text-align:right">₺${parseFloat(k.birim_fiyat_tl || 0).toFixed(2)}</td>
            <td style="padding:8px;text-align:right;font-weight:900">₺${net.toFixed(2)}</td>
        </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html><head><title>Fatura - ${siparis.siparis_no}</title>
    <style>body{font-family:Arial,sans-serif;padding:30px;color:#111}h1{font-size:22px;margin:0}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#0f172a;color:white;padding:8px;text-align:left}td{font-size:13px}@media print{.no-print{display:none}}</style></head>
    <body>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px">
        <div>
            <h1>📄 FATURA / İRSALİYE</h1>
            <p style="color:#64748b;margin:4px 0;font-size:13px">Mizanet Tekstil Sistemi</p>
        </div>
        <div style="text-align:right;font-size:13px">
            <div><b>Sipariş No:</b> ${siparis.siparis_no}</div>
            <div><b>Tarih:</b> ${tarih}</div>
            <div><b>Durum:</b> ${siparis.durum?.toUpperCase()}</div>
            <div><b>Kanal:</b> ${siparis.kanal}</div>
        </div>
    </div>
    <div style="background:#f8fafc;padding:12px 16px;border-radius:8px;margin-bottom:20px;font-size:13px">
        <b>MÜŞTERİ:</b> ${musteriAdi}
    </div>
    <table>
        <thead><tr><th>Kod</th><th>Ürün</th><th>Beden</th><th>Adet</th><th>Birim Fiyat</th><th>Toplam</th></tr></thead>
        <tbody>${satirlar}</tbody>
    </table>
    <div style="margin-top:20px;text-align:right;font-size:16px">
        <b>GENEL TOPLAM: ₺${parseFloat(siparis.toplam_tutar_tl || 0).toFixed(2)}</b>
    </div>
    ${siparis.notlar ? `<p style="margin-top:16px;font-size:12px;color:#64748b">Not: ${siparis.notlar}</p>` : ''}
    <p style="margin-top:30px;font-size:11px;color:#94a3b8">Bu belge Mizanet Sistemi tarafından otomatik oluşturulmuştur.</p>
    <script>window.onload = function() { window.print(); }</script>
    </body></html>`;

    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
};
