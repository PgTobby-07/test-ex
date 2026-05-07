# eWP Backend

Backend API for the `eWP` marketplace.  
Built with `FastAPI`, `SQLAlchemy 2`, `MySQL`, `Alembic`, `Stripe`, and `Celery`.

## What it includes

- User registration, login, profile, and avatar upload
- Categories, products, product variants, and homepage feed endpoints
- Cart, favorites, coupons, and orders
- Stripe payment intent creation and payment confirmation flow
- Seller dashboard, admin dashboard, and admin management endpoints
- File uploads served from `/uploads`

## Requirements

- `Python 3.14`
- `MySQL`
- `Redis` for Celery-related setup
- Virtual environment recommended

## Environment variables

The backend reads values from `backend/.env`.

Required keys from `app/config.py`:

```env
APP_ENV=development
SECRET_KEY=your_secret_key
DATABASE_URL=mysql+aiomysql://user:password@localhost:3306/ewp
REDIS_URL=redis://localhost:6379/0
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

## Install

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Database setup

Run migrations before starting the API:

```bash
./venv/bin/alembic upgrade head
```

Important: the current codebase requires all migrations, including carts, favorites, product variants, product images, and coupons.

## Run in development

```bash
source venv/bin/activate
uvicorn app.main:app --reload
```

Default local API:

`http://localhost:8000`

Health/root endpoint:

`GET /`

## Main API areas

`/users`
- register
- login
- current user
- profile update
- avatar upload

`/products`
- categories
- list/filter products
- homepage feed
- product details

`/cart`
- cart read/update
- coupon apply/remove

`/favorites`
- add/remove/list favorites

`/orders`
- list orders
- confirm/delete pending orders
- create checkout payment intent

`/payment`
- payment confirmation and Stripe-related callbacks

`/dashboard`
- seller dashboard
- admin dashboard

`/admin`
- category, product, and user management

## Project structure

`app/domain`
- `user`
- `product`
- `cart`
- `favorite`
- `coupon`
- `order`
- `payment`
- `dashboard`
- `admin`

`app/migrations`
- Alembic migration files

`uploads`
- uploaded avatars and product-related files

## Useful commands

```bash
./venv/bin/alembic upgrade head
python3 -m py_compile app/main.py
uvicorn app.main:app --reload
```

## Notes

- CORS currently allows `http://localhost:3000` and `https://localhost:3000`.
- SQL logging is enabled in `app/database.py` with `echo=True`.
- Stripe payment creation is implemented in `app/core/stripe.py`.
