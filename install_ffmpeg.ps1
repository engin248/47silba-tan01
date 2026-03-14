$ProgressPreference = 'SilentlyContinue'
Write-Host "FFmpeg indiriliyor... Lütfen bekleyin (Yaklaşık 30-40 MB)..."
Invoke-WebRequest -Uri "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip" -OutFile "ffmpeg_temp.zip"

Write-Host "Sıkıştırılmış dosya açılıyor..."
Expand-Archive -Path "ffmpeg_temp.zip" -DestinationPath "ffmpeg_temp_folder" -Force

Write-Host "ffmpeg.exe dosyası stream-server klasörüne taşınıyor..."
$exePath = Get-ChildItem -Path "ffmpeg_temp_folder" -Filter "ffmpeg.exe" -Recurse | Select-Object -ExpandProperty FullName | Select-Object -First 1
Move-Item -Path $exePath -Destination "c:\Users\Admin\CUsersAdminDesktop47_SIL_BASTAN_01\stream-server\ffmpeg.exe" -Force

Write-Host "Geçici dosyalar temizleniyor..."
Remove-Item -Path "ffmpeg_temp.zip" -Force
Remove-Item -Path "ffmpeg_temp_folder" -Recurse -Force

Write-Host "✅ FFMPEG KURULUMU BAŞARIYLA TAMAMLANDI!"
