# 🛒 EWP — Full-Stack E-commerce Backend (FastAPI + Stripe)

A production-style e-commerce backend built with FastAPI, featuring authentication, product management, cart system, order processing, and real Stripe payment integration with webhooks.

---

## 🚀 Features

### 🧑 Authentication
- JWT-based authentication
- Role-based access (user / admin / superadmin)

### 🛍 Products
- Categories & products
- Product variants (price, stock)
- Search, filtering, pagination
- Image upload support

### 🛒 Cart System
- Add / update / remove items
- Per-user cart management

### 📦 Orders
- Checkout flow from cart
- Order history
- Order lifecycle:
  - pending → confirmed → shipped → delivered

### 💳 Payments (Stripe)
- PaymentIntent integration
- Webhook listener
- Automatic order update:
  - `payment_status = paid`
  - `status = confirmed`

### 🔐 Admin Panel APIs
- View all users
- View all orders
- Deactivate users

---

## 🧱 Tech Stack

- **Backend:** FastAPI, SQLAlchemy (Async)
- **Database:** MySQL
- **Auth:** JWT (python-jose)
- **Payments:** Stripe API + Webhooks
- **Migrations:** Alembic
- **Storage:** Local file uploads (images)
- **Deployment:** Railway (ready)

---

## 📂 Project Structure

backend/
├── app/
│ ├── domain/
│ │ ├── user/
│ │ ├── product/
│ │ ├── cart/
│ │ ├── order/
│ │ ├── payment/
│ │ └── admin/
│ ├── config.py
│ ├── database.py
│ └── main.py
├── uploads/
├── requirements.txt
└── Procfile


---

## ⚙️ Environment Variables

Create a `.env` file:

```env
APP_ENV=development
SECRET_KEY=your_secret_key

DATABASE_URL=mysql+aiomysql://user:password@localhost:3306/ewp

STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

▶️ Run Locally
cd backend
source venv/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --reload

Open:

http://127.0.0.1:8000/docs

💳 Stripe Webhook (Local)
stripe listen --forward-to localhost:8000/payments/webhook

Trigger test:

stripe trigger payment_intent.succeeded

🧠 Key Concepts Implemented
Async database handling (SQLAlchemy async)
Repository + service architecture
Stripe PaymentIntent flow
Webhook event processing
Role-based authorization
File uploads & static serving

📌 Future Improvements
Deploy frontend (Next.js)
S3 image storage
Redis caching
Background jobs (Celery)
Email notifications
👨‍💻 Author

Omar Diab
Software Engineering Student | Backend Developer

⭐ Why this project?

This project demonstrates real-world backend architecture and payment integration used in production systems.


---

# 💣 This README does 3 things

- Looks **professional**
- Shows **real backend knowledge**
- Impresses **recruiters instantly**

---

# 🚀 Next step

Say:

👉 **deployment continue**

We will:

🔥 Deploy on Railway  
🔥 Connect database  
🔥 Get LIVE API URL  
🔥 Put it in your CV  

## 🌐 Live API
https://your-app.up.railway.app/docs

## 🎥 Demo
- Register → Login → Add to cart → Checkout → Payment → Order confirmed

Designed and deployed a scalable e-commerce backend with FastAPI, async SQLAlchemy, and Stripe integration, including secure authentication, cart management, order processing, and webhook-driven payment confirmation.

# eWP Frontend

Frontend for the `eWP` marketplace.  
Built with `Next.js 16`, `React 19`, `TypeScript`, `Tailwind CSS 4`, `axios`, and `react-toastify`.

## What it includes

- Public storefront with homepage, categories, products, product details, and search
- Authentication pages for login and register
- Cart, favorites, coupons, checkout, orders, and profile pages
- Seller and admin dashboard screens
- Theme switcher and multilingual UI (`EN`, `TR`, `AR`)
- Stripe checkout UI using `Stripe.js`

## Requirements

- `Node.js 20+`
- `npm`
- Running backend API

## Environment variables

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## Install

```bash
cd frontend
npm install
```

## Run in development

```bash
npm run dev
```

Open `http://localhost:3000`.

## Build

```bash
npm run build
npm run start
```

## Main app structure

`src/app/(auth)`
- `login`
- `register`

`src/app/(main)`
- `/`
- `/about`
- `/cart`
- `/checkout`
- `/coupons`
- `/favorites`
- `/orders`
- `/products`
- `/profile`

## Notes

- Auth token is stored in `localStorage` and attached through `src/lib/api.ts`.
- The UI expects the backend API to be available through `NEXT_PUBLIC_API_URL`.
- Stripe checkout requires both the frontend publishable key and the backend Stripe secret/webhook setup.

## Useful commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npm exec tsc --noEmit
```