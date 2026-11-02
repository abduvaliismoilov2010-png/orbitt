@echo off
cd /d "%~dp0www"
echo Orbit Focus: http://localhost:8080  (telefon bir xil Wi-Fi'da bo'lsa, kompyuter IP manzilini ishlating)
python -m http.server 8080
