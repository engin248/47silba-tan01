# Sistem İzleme Scripti
# Her 60 saniyede git diff takip eder, değişiklikleri log'a yazar
# Çalıştır: powershell -ExecutionPolicy Bypass -File izle.ps1

$LOG_DOSYASI = "$PSScriptRoot\sistem_izle_log.txt"
$PROJE = "C:\Users\Esisya\Desktop\47_SilBaştan"
$SURE = 3600  # 1 saat (saniye)
$SON_COMMIT = ""

function Yaz($msg) {
    $zaman = Get-Date -Format "HH:mm:ss"
    $satir = "[$zaman] $msg"
    Write-Host $satir
    Add-Content -Path $LOG_DOSYASI -Value $satir -Encoding UTF8
}

Yaz "=== SİSTEM İZLEME BAŞLADI ==="
Yaz "Süre: 1 saat | Proje: $PROJE"
Yaz "==============================="

$baslangic = Get-Date
$dongüSayisi = 0

while ((Get-Date) - $baslangic -lt [TimeSpan]::FromSeconds($SURE)) {
    $dongüSayisi++
    
    # Git commit kontrolü
    $yeniCommit = git -C $PROJE log --oneline -1 2>$null
    if ($yeniCommit -and $yeniCommit -ne $SON_COMMIT) {
        if ($SON_COMMIT -ne "") {
            Yaz "🔔 YENİ COMMIT TESPİT EDİLDİ!"
            Yaz "   $yeniCommit"
            
            # Değişen dosyaları listele
            $degisen = git -C $PROJE diff HEAD~1 HEAD --name-status 2>$null
            foreach ($satir in $degisen) {
                Yaz "   DOSYA: $satir"
            }
        }
        $SON_COMMIT = $yeniCommit
    }

    # Uncommitted değişiklik var mı?
    $uncommitted = git -C $PROJE status --short 2>$null
    if ($uncommitted) {
        Yaz "⚠️  KAYDEDILMEMIŞ DEĞİŞİKLİK:"
        foreach ($satir in $uncommitted) {
            Yaz "   $satir"
        }
    }

    # Dev server sağlık kontrolü
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:3000/arge" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        if ($r.StatusCode -ne 200) { Yaz "⚠️  /arge HTTP $($r.StatusCode)" }
    } catch {
        Yaz "🚨 /arge ERİŞİLEMİYOR: $($_.Exception.Message)"
    }

    if ($dongüSayisi % 5 -eq 0) {
        Yaz "--- KONTROL #$dongüSayisi | $(Get-Date -Format 'HH:mm') ---"
    }

    Start-Sleep -Seconds 60
}

Yaz "=== İZLEME TAMAMLANDI (1 SAAT) ==="
