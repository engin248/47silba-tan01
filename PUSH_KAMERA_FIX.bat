@echo off
cd /d "C:\Users\Admin\Desktop\47_SIL_BASTAN_01"
git add stream-server/go2rtc.yaml
git add stream-server/BASLAT.bat
git add src/features/kameralar/components/KameralarMainContainer.js
git add src/features/kameralar/components/CameraPlayer.js
git commit -m "fix: kamera sistemi - git conflict temizlendi, hardcode URL ENV e baglanidi"
git push origin main
echo.
echo [OK] PUSH TAMAMLANDI
pause
