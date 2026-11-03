@echo off
chcp 65001 >nul
title RoboPrompt - Deploy & Push ke GitHub
color 0B
cls

echo ===============================================================================
echo       ROBOPROMPT - PPLG SMKN 1 BAWANG (KODING & KECERDASAN ARTIFISIAL)
echo                  SISTEM OTOMATISASI DEPLOYMENT GITHUB & NETLIFY
echo ===============================================================================
echo.

:: Cek apakah git terpasang
git --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Git belum terpasang atau belum masuk ke PATH sistem.
    echo Silakan pasang Git terlebih dahulu dari: https://git-scm.com/
    echo.
    pause
    exit /b
)

:: Ambil remote URL saat ini
for /f "tokens=*" %%i in ('git remote get-url origin 2^>nul') do set CURRENT_REMOTE=%%i

echo Status Repository Lokal:
echo - Branch: main
if defined CURRENT_REMOTE (
    echo - Remote Origin saat ini: %CURRENT_REMOTE%
) else (
    echo - Remote Origin: [Belum Terhubung]
)
echo.
echo ===============================================================================
echo PANDUAN PENTING SEBELUM PUSH:
echo 1. Pastikan Anda sudah login ke akun GitHub di peramban (browser).
echo 2. Buka: https://github.com/new
echo 3. Masukkan Repository name: roboprompt
echo 4. JANGAN centang "Add a README file" (karena file lokal sudah lengkap).
echo 5. Klik tombol hijau "Create repository".
echo ===============================================================================
echo.

if defined CURRENT_REMOTE (
    echo Tekan [ENTER] langsung untuk menggunakan remote:
    echo   %CURRENT_REMOTE%
    echo Atau ketik URL GitHub baru di bawah:
    set /p USER_REMOTE="URL GitHub [Enter jika sesuai]: "
) else (
    set /p USER_REMOTE="Masukkan URL Repository GitHub Anda (contoh: https://github.com/username/roboprompt.git): "
)

if not defined USER_REMOTE (
    if defined CURRENT_REMOTE (
        set TARGET_REMOTE=%CURRENT_REMOTE%
    ) else (
        echo [ERROR] URL repository tidak boleh kosong!
        pause
        exit /b
    )
) else (
    set TARGET_REMOTE=%USER_REMOTE%
)

echo.
echo [1/3] Menghubungkan remote Git ke: %TARGET_REMOTE%...
git remote remove origin 2>nul
git remote add origin %TARGET_REMOTE%
git branch -M main

echo [2/3] Menyiapkan seluruh perubahan terbaru...
git add .
git commit -m "chore: prepare production deployment for PPLG SMKN 1 Bawang" >nul 2>&1

echo [3/3] Mengunggah (Push) ke GitHub branch main...
echo (Jika jendela login GitHub muncul, silakan pilih 'Sign in with your browser')
echo.
git push -u origin main

if %errorlevel% equ 0 (
    color 0A
    echo.
    echo ===============================================================================
    echo [BERHASIL] Seluruh kode RoboPrompt berhasil diunggah ke GitHub!
    echo ===============================================================================
    echo.
    echo LANGKAH TERAKHIR - HUBUNGKAN KE NETLIFY:
    echo 1. Buka: https://app.netlify.com/
    echo 2. Klik "Add new site" -> "Import an existing project" -> pilih "GitHub".
    echo 3. Pilih repository Anda yang baru saja diunggah.
    echo 4. Pada bagian "Environment variables", tambahkan:
    echo      Key   : GEMINI_API_KEY
    echo      Value : (Masukkan Google Gemini API Key Anda dari Google AI Studio)
    echo 5. Klik "Deploy roboprompt". Web Anda langsung online dalam hitungan detik!
    echo.
) else (
    color 0E
    echo.
    echo ===============================================================================
    echo [CATATAN / KENDALA SAAT PUSH]
    echo 1. Jika muncul 'Repository not found', pastikan repository sudah dibuat di:
    echo    https://github.com/new
    echo 2. Jika repository dibuat secara Private, pastikan akun GitHub Anda sudah login
    echo    dan diizinkan pada Git Credential Manager.
    echo ===============================================================================
    echo.
)

pause
