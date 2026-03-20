
# TAM SİSTEM HARITA TARAMA SCRİPTİ
# Her modül için detaylıca tüm işlem noktalarını çıkarır

$srcPath = "src"
$output = @()

$output += "# 🗺️ TAM SİSTEM NOKTA HARİTASI"
$output += "**Tarih:** $(Get-Date -Format 'dd.MM.yyyy HH:mm')"
$output += "**Yöntem:** Otomatik kod taraması"
$output += ""
$output += "---"

# ─── KATEGORİLER ───────────────────────────────────────────────────────────
$kategoriler = @(
    @{ Ad = "FEATURE MODÜLLERI"; Yol = "src/features" },
    @{ Ad = "API ROTALARI"; Yol = "src/app/api" },
    @{ Ad = "LIB / ALTYAPI"; Yol = "src/lib" },
    @{ Ad = "GLOBAL (app/)"; Yol = "src/app"; MaxDepth = 1 }
)

foreach ($kat in $kategoriler) {
    $output += ""
    $output += "---"
    $output += "## 📦 $($kat.Ad)"
    $output += ""

    if ($kat.Yol -eq "src/app" ) {
        $dirs = @("src/app")
        $jsFiles = Get-ChildItem -Path "src/app" -MaxDepth 1 -Filter "*.js" -File
    } elseif ($kat.Yol -eq "src/lib") {
        $dirs = @("src/lib")
        $jsFiles = Get-ChildItem -Path "src/lib" -Filter "*.js" -File -Recurse
    } elseif ($kat.Yol -eq "src/app/api") {
        $dirs = Get-ChildItem -Path "src/app/api" -Directory
        $jsFiles = @()
    } else {
        $dirs = Get-ChildItem -Path $kat.Yol -Directory
        $jsFiles = @()
    }

    if ($kat.Yol -eq "src/app/api") {
        foreach ($dir in $dirs) {
            $files = Get-ChildItem -Path $dir.FullName -Filter "*.js" -Recurse -File
            if ($files.Count -eq 0) { continue }
            $output += "### 🔌 /api/$($dir.Name)"
            foreach ($f in $files) {
                $content = Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue
                $satir = ($content -split "`n").Count
                $output += "- **$($f.Name)** ($satir satır)"
                # HTTP methods
                $methods = [regex]::Matches($content, "export async function (GET|POST|PUT|DELETE|PATCH)") | ForEach-Object { $_.Groups[1].Value }
                if ($methods.Count -gt 0) { $output += "  - HTTP: $($methods -join ', ')" }
                # Supabase
                $tables = [regex]::Matches($content, "supabase\.from\(['""]([^'""]+)['""]\)") | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique
                if ($tables.Count -gt 0) { $output += "  - DB: $($tables -join ', ')" }
            }
            $output += ""
        }
    } elseif ($kat.Yol -eq "src/lib") {
        foreach ($f in $jsFiles) {
            $content = Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue
            $satir = ($content -split "`n").Count
            $exports = [regex]::Matches($content, "export (default |async )?function (\w+)") | ForEach-Object { $_.Groups[2].Value }
            $output += "### 📄 $($f.Name) ($satir satır)"
            if ($exports.Count -gt 0) { $output += "- Fonksiyonlar: $($exports -join ', ')" }
            $tables = [regex]::Matches($content, "supabase\.from\(['""]([^'""]+)['""]\)") | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique
            if ($tables.Count -gt 0) { $output += "- DB: $($tables -join ', ')" }
            $output += ""
        }
    } elseif ($kat.Yol -eq "src/app") {
        foreach ($f in $jsFiles) {
            $content = Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue
            $satir = ($content -split "`n").Count
            $output += "### 📄 $($f.Name) ($satir satır)"
            $output += ""
        }
    } else {
        # FEATURE MODÜLLERI
        foreach ($dir in $dirs) {
            $files = Get-ChildItem -Path $dir.FullName -Filter "*.js" -Recurse -File
            if ($files.Count -eq 0) { continue }

            $toplamSatir = 0
            $toplamSupabase = 0
            $toplamState = 0

            $output += "### 🧩 $($dir.Name.ToUpper())"

            foreach ($f in $files) {
                $content = Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue
                if (-not $content) { continue }

                $satirSayisi = ($content -split "`n").Count
                $toplamSatir += $satirSayisi

                # Supabase tabloları
                $tables = [regex]::Matches($content, "supabase\.from\(['""]([^'""]+)['""]\)") | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique
                $toplamSupabase += $tables.Count

                # useState sayısı
                $stateCount = ([regex]::Matches($content, "useState\(")).Count
                $toplamState += $stateCount

                # useEffect sayısı
                $effectCount = ([regex]::Matches($content, "useEffect\(")).Count

                # Fonksiyonlar
                $funcs = [regex]::Matches($content, "const (\w+) = (async )?(\([^)]*\)|[^=]+) =>") | ForEach-Object { $_.Groups[1].Value } | Where-Object { $_ -cmatch "^[a-z]" } | Select-Object -First 8

                # Telegram
                $telegram = ([regex]::Matches($content, "telegramBildirim|telegram")).Count

                # Silme onayı
                $confirmCount = ([regex]::Matches($content, "confirm\(")).Count

                # Realtime
                $realtimeCount = ([regex]::Matches($content, "supabase\.channel")).Count

                $relativePath = $f.FullName.Replace((Get-Location).Path + "\", "").Replace("\", "/")

                $output += ""
                $output += "#### 📄 $($f.Name) ($satirSayisi satır)"
                $output += "- Yol: \`$relativePath\`"
                if ($tables.Count -gt 0) { $output += "- **DB Tablosu ($($tables.Count)):** $($tables -join ' | ')" }
                if ($stateCount -gt 0) { $output += "- **State:** $stateCount adet useState" }
                if ($effectCount -gt 0) { $output += "- **Yan Etki:** $effectCount adet useEffect" }
                if ($realtimeCount -gt 0) { $output += "- **Realtime:** $realtimeCount kanal" }
                if ($telegram -gt 0) { $output += "- **Telegram:** $telegram tetikleyici" }
                if ($confirmCount -gt 0) { $output += "- **Silme Onayı:** $confirmCount adet confirm()" }
                if ($funcs.Count -gt 0) { $output += "- **Fonksiyonlar:** $($funcs -join ', ')..." }
            }

            $output += ""
            $output += "> **$($dir.Name) Özeti:** $toplamSatir satır | $toplamSupabase DB sorgu | $toplamState state"
            $output += ""
        }
    }
}

# ─── GENEL ÖZET ─────────────────────────────────────────────────────────────
$output += "---"
$output += "## 🏁 GENEL SİSTEM ÖZETİ"
$output += ""

$allJs = Get-ChildItem -Path "src" -Recurse -Filter "*.js" -File
$toplamDosya = $allJs.Count
$toplamSatir = ($allJs | Get-Content | Measure-Object -Line).Lines
$toplamByte = ($allJs | Measure-Object -Property Length -Sum).Sum
$toplamSupabase = ($allJs | Select-String "supabase\.from\(" | Measure-Object).Count
$toplamState = ($allJs | Select-String "useState\(" | Measure-Object).Count
$toplamEffect = ($allJs | Select-String "useEffect\(" | Measure-Object).Count
$toplamTelegram = ($allJs | Select-String "telegramBildirim" | Measure-Object).Count
$toplamConfirm = ($allJs | Select-String "confirm\(" | Measure-Object).Count
$toplamRealtime = ($allJs | Select-String "supabase\.channel\(" | Measure-Object).Count
$toplamAPI = (Get-ChildItem -Path "src/app/api" -Recurse -Filter "route.js" | Measure-Object).Count

$output += "| Ölçüt | Rakam |"
$output += "|-------|-------|"
$output += "| Toplam JS Dosyası | **$toplamDosya** |"
$output += "| Toplam Kod Satırı | **$toplamSatir** |"
$output += "| Toplam Boyut | **$(($toplamByte/1MB).ToString('F1')) MB** |"
$output += "| DB Sorgu Noktası | **$toplamSupabase** |"
$output += "| State Noktası | **$toplamState** |"
$output += "| Yan Etki (useEffect) | **$toplamEffect** |"
$output += "| Telegram Bildirimi | **$toplamTelegram** |"
$output += "| Silme Onayı | **$toplamConfirm** |"
$output += "| Realtime Kanalı | **$toplamRealtime** |"
$output += "| API Route | **$toplamAPI** |"

$output | Out-File -FilePath "tmp/tam_sistem_harita.md" -Encoding UTF8
Write-Host "TAMAMLANDI: tmp/tam_sistem_harita.md"
