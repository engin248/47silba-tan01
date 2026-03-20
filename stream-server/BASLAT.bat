@echo off
title go2rtc - Kamera Stream Sunucusu
color 0A
echo ============================================
echo  KARARGAH VIZYON PANELI - Stream Sunucusu
echo  Neutron NVR @ 192.168.1.200
echo ============================================
echo.

:: go2rtc.exe bu klasorde olmali
if not exist "%~dp0go2rtc.exe" (
    echo [HATA] go2rtc.exe bulunamadi!
    echo.
    echo Lutfen indirin:
    echo https://github.com/AlexxIT/go2rtc/releases/latest
    echo Dosyayi su klasore koyun:
    echo %~dp0go2rtc.exe
    echo.
    pause
    exit /b 1
)

echo [OK] go2rtc.exe bulundu
echo [*] NVR baglantisi kontrol ediliyor...
ping -n 1 192.168.1.200 >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] NVR erisilebilir - 192.168.1.200
) else (
    echo [UYARI] NVR erisilemedi - 192.168.1.200
    echo         Fabrika aginda oldugunuzdan emin olun
)
echo.
echo [*] go2rtc baslatiliyor...
echo [*] Web arayuzu: http://localhost:1984
echo [*] Durdurmak icin: CTRL+C
echo.
echo ============================================

cd /d "%~dp0"
start "go2rtc" /b go2rtc.exe -config go2rtc.yaml
<<<<<<< HEAD
start "cloudflared" /b "%~dp0cloudflared.exe" tunnel --config "%~dp0tunnel-config.yml" run d3d1c0ab-135f-4934-87be-b5b459a292e7
=======
start "cloudflared" /b "C:\Users\Admin\CUsersAdminDesktop47_SIL_BASTAN_01\stream-server\cloudflared.exe" tunnel --config tunnel-config.yml run d3d1c0ab-135f-4934-87be-b5b459a292e7
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552

echo.
echo [*] KAMERA YAYIN SISTEMI (LOCAL VE CLOUD) BASLATILDI.
echo [*] Bu pencere acik kaldigi surece yayin devan edecektir.
pause
