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
go2rtc.exe -config go2rtc.yaml

pause
