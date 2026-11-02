# Orbit Focus — iOS va Android

Ilova ikki yo'l bilan telefonga o'rnatiladi.

## 1-yo'l: PWA (eng oson, iPhone ham, Android ham, do'kon va Mac shart emas)

Papkadagi `www/` ni istalgan bepul hostingga joylang (Netlify Drop, GitHub Pages, Cloudflare Pages) — HTTPS manzil olasiz. Keyin:

- **iPhone (Safari):** manzilni oching → Ulashish tugmasi → **Bosh ekranga qo'shish**.
- **Android (Chrome):** manzilni oching → ⋮ menyu → **Ilovani o'rnatish** (Install app).

Ilova to'liq ekranda, oflayn ishlaydi, o'z ikonkasi bor. Ma'lumotlar telefonda saqlanadi.

Tezkor sinash (kompyuterda): `serve.bat` → `http://localhost:8080`. Telefonda sinash uchun HTTPS kerak (hosting).

## APK ni kompyuterga hech narsa o'rnatmasdan olish (GitHub orqali)

1. github.com da bepul akkaunt oching → **New repository** (private bo'lsa ham bo'ladi).
2. Shu papkadagi hamma fayllarni (`.github` papkasi bilan) repoga yuklang (**Add file → Upload files**).
3. **Actions** bo'limi → "Build Android APK" → bir necha daqiqa kuting.
4. Tugagach, ish ichidagi **Artifacts → OrbitFocus-apk** ni yuklab oling, zip ichida `app-debug.apk`.
5. APK ni telefonga o'tkazib oching (Sozlamalarda "noma'lum manbalardan o'rnatish"ga ruxsat bering).

## 2-yo'l: Haqiqiy ilova (Capacitor)

Node.js kerak.
```
npm install
npm run add:android     # Android loyiha yaratadi
npm run open:android    # Android Studio ochiladi -> Build > Build APK(s)
```
`app-debug.apk` ni telefonga ko'chirib o'rnating (Play Market shart emas).

iPhone uchun **Mac + Xcode** kerak:
```
npm install
npm run add:ios
npm run open:ios        # Xcode -> telefonni ulang -> Run
```
Do'konga chiqarish uchun: Google Play (bir martalik $25), App Store (yiliga $99). Faqat o'zingizning telefoningizda sinash uchun bepul Apple ID yetadi (7 kun amal qiladi).

Kod o'zgarsa: `npm run sync`.

## Telefondagi farqlar
- Papka tanlash yo'q — **🎵 Musiqa** tugmasi bilan bir nechta audio fayl tanlanadi (qolgani — tasodifiy keyingi qo'shiq, effektlar, sozlamalar — o'sha).
- Pastda 5 ta bo'limli navigatsiya paneli; Space/Ctrl tugmalari o'rniga ekranga tegiladi.
- Ovoz birinchi tegishdan keyin ochiladi (iOS qoidasi).
- Ilova fonda/ekran qulflanganda taymer vaqti to'g'ri hisoblanadi, lekin tugash signali ilova ochiq bo'lgandagina chaladi. Taymer ishlayotganda ekranni yoqilgan qoldirish tavsiya etiladi (ilova buni o'zi so'raydi).
