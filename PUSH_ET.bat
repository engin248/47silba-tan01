@echo off
cd /d "C:\Users\Admin\Desktop\47_SIL_BASTAN_01"
echo.
echo ========================================
echo   NIZAM SISTEMI - GIT PUSH
echo ========================================
echo.
git add -A
git status
echo.
set /p MESAJ="Commit mesaji yaz (veya Enter bos birak): "
if "%MESAJ%"=="" set MESAJ=fix: Sistem guncelleme
git commit -m "%MESAJ%"
git push origin main
echo.
echo ========================================
echo   PUSH TAMAMLANDI! Vercel deploy ediyor...
echo   2 dakika bekle sonra siteyi test et.
echo ========================================
echo.
pause
