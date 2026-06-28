# SmartLux Logistic — Backend (API)

Bu backend SmartLux platformasiga ko'p foydalanuvchi, umumiy ma'lumotlar bazasi va login tizimini qo'shadi.

## Texnologiyalar
- Node.js + Express — server
- PostgreSQL — ma'lumotlar bazasi
- JWT — login/parol autentifikatsiya

---

## 1-QADAM: Railway'da hisob ochish

1. https://railway.app ga kiring, GitHub orqali ro'yxatdan o'ting (bepul).
2. To'lov kartangizni bog'lang (Railway "Hobby" tarifi — oyiga taxminan $5, faqat ishlatilgan miqdor uchun to'lanadi, 4-10 kishilik tizim uchun bundan oshmaydi).

## 2-QADAM: Postgres bazasini yaratish

1. Railway dashboardda **"New Project"** tugmasini bosing.
2. **"Provision PostgreSQL"** ni tanlang — bir necha soniyada baza tayyor bo'ladi.
3. Postgres kartochkasini bosing → **"Variables"** bo'limidan `DATABASE_URL` ni ko'rasiz (buni keyin ishlatamiz, lekin avtomatik ulanadi).

## 3-QADAM: Backend kodini yuklash

### A) GitHub orqali (tavsiya etiladi)
1. Bu `smartlux-backend` papkasini GitHub'ga yangi repository sifatida yuklang.
2. Railway loyihasida **"New"** → **"GitHub Repo"** → repositoryni tanlang.
3. Railway avtomatik aniqlaydi va deploy qiladi.

### B) Railway CLI orqali (agar GitHub ishlatmasangiz)
```bash
npm install -g @railway/cli
railway login
cd smartlux-backend
railway init
railway up
```

## 4-QADAM: Muhit o'zgaruvchilari (Environment Variables)

Railway loyihangizda backend service'ni oching → **Variables** bo'limiga o'ting va qo'shing:

| Nom | Qiymat |
|---|---|
| `JWT_SECRET` | O'zingiz tanlagan uzun maxfiy so'z, masalan: `smartlux2026maxfiyKalitXYZ` |
| `DATABASE_URL` | Bu Railway tomonidan **avtomatik** qo'shiladi (Postgres bilan bog'langanda) — qo'lda yozmang |

> **Eslatma:** Agar `DATABASE_URL` avtomatik ko'rinmasa, Postgres service va backend service'ni bir-biriga **"Connect"** qilib bog'lang (Railway interfeysida ikki service orasida chiziq tortiladi).

## 5-QADAM: Bazani sozlash (jadvallarni yaratish)

Railway dashboardda backend service'ni oching → **Settings** → **Deploy** bo'limida bitta martalik buyruq ishga tushiring, yoki terminal orqali:

```bash
railway run npm run migrate
```

Bu barcha jadvallarni yaratadi va standart admin hisobini ochadi:
- **Login:** `admin`
- **Parol:** `admin123`

⚠️ **Birinchi kirishdan keyin parolni albatta o'zgartiring!**

## 6-QADAM: Backend manzilini olish

Railway sizga avtomatik domen beradi, masalan:
```
https://smartlux-backend-production.up.railway.app
```//Buni **Settings → Networking → Generate Domain** orqali oling.

## 7-QADAM: Frontend'ni backend'ga ulash

`index.html` faylida (Netlify'dagi) quyidagi qatorni topib, backend manzilini yozing:

```js
const API_URL = 'https://smartlux-backend-production.up.railway.app/api';
```

Bu qadamni men frontend faylga alohida qo'shib beraman — frontend hozircha localStorage bilan ishlaydi, uni API'ga ulashtirish keyingi bosqich (frontend o'zgarishi katta ish, alohida so'rasangiz tayyorlab beraman).

---

## API yo'llari (Endpoints)

| Method | Yo'l | Tavsif |
|---|---|---|
| POST | `/api/auth/login` | Kirish |
| POST | `/api/auth/register` | Yangi xodim qo'shish |
| GET | `/api/cargos` | Barcha yuklar |
| POST | `/api/cargos` | Yangi yuk(lar) qo'shish |
| PUT | `/api/cargos/:id` | Yukni tahrirlash |
| DELETE | `/api/cargos/:id` | Yukni o'chirish |
| GET | `/api/cargos/stats/summary` | Dashboard statistikasi |
| GET/POST/PUT/DELETE | `/api/drivers` | Haydovchilar |
| GET/POST/PUT/DELETE | `/api/workers` | Ishchilar |
| GET/POST/PUT/DELETE | `/api/companies` | Korxonalar |
| GET/POST/PUT/DELETE | `/api/finance` | Moliya yozuvlari |
| GET/PUT | `/api/settings` | Sozlamalar (NDS foizi va h.k.) |

Barcha `/api/*` (login/register'dan tashqari) so'rovlarga shu sarlavha kerak:
```
Authorization: Bearer <token>
```

---

## Xarajat taxmini (4-10 kishi uchun)

- Railway Hobby: ~$5/oy (backend + Postgres birga)
- Trafik juda kichik bo'lgani uchun bundan oshish ehtimoli kam
