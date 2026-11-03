@echo off
title Push RoboPrompt ke GitHub
echo ============================================================
echo   UNGGAH / PUSH ROBOPROMPT KE GITHUB
echo ============================================================
echo.
echo Pastikan Anda sudah membuat repository baru di:
echo https://github.com/new
echo.
set /p REPO_URL="Masukkan URL Repository GitHub Anda (contoh: https://github.com/username/roboprompt.git): "
if "%REPO_URL%"=="" (
    echo URL tidak boleh kosong!
    pause
    exit /b
)
echo.
echo Menghubungkan remote GitHub...
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main
echo Mengunggah file ke branch main...
git push -u origin main
echo.
if %errorlevel% equ 0 (
    echo ============================================================
    echo [BERHASIL] Repository GitHub Anda siap dideploy ke Netlify!
    echo Silakan buka: https://app.netlify.com/
    echo ============================================================
) else (
    echo [GAGAL] Terjadi kesalahan saat push. Pastikan koneksi dan izin akun GitHub benar.
)
pause
