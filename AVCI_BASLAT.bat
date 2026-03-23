@echo off
chcp 65001 >nul
echo.
echo ══════════════════════════════════════════════════════
echo   THE ORDER — NİZAM: AV OPERASYONU BAŞLATILIYOR
echo ══════════════════════════════════════════════════════
echo.
echo [1/2] 1. EKİP (VERİ MADENCİSİ / SCOUT) aktif ediliyor...
echo.

py "%~dp0scripts\arge_ajanlari\1_Scraper_Ajan.py"

echo.
echo ══════════════════════════════════════════════════════
echo   OPERASYON SONA ERDİ. Sonuçlar Supabase'e gönderildi.
echo ══════════════════════════════════════════════════════
echo.
pause
