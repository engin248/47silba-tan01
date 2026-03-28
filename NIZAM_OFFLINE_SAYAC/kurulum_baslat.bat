@echo off
color 0A
echo ========================================================
echo NIZAM YEREL (OFFLINE) AI SAYACI KURULUM VE BASLATMA MENU
echo ========================================================
echo Lutfen Bekleyin, Python Indirici (PIP) Makineden Uyandiriliyor...
python -m ensurepip --upgrade
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
echo.
echo ========================================================
echo KAMERA SAYACI (AI) BASLATILIYOR...
echo (Bu siyah ekrani kapatirsaniz sayim durur. Simge durumuna alin.)
echo ========================================================
python lokal_sayac.py
pause
