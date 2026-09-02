# Architecture Essentials — Quick Reference
# Cruzaro E-Commerce Platform

> Quick-reference cheatsheet. For full detail see `architecture.md` and `prd.md`.

---

## Stack at a Glance

| What | How |
|------|-----|
| Frontend | React 18 + Vite + Tailwind CSS v3 |
| Backend | Node.js ESM + Express v4 |
| Database | PostgreSQL 16 (Docker) |
| ORM | Prisma v5.11 |
| Auth | JWT (7-day expiry) + bcryptjs |
| Images | Cloudinary SDK v2 |
| Routing (FE) | React Router DOM v7 |
| HTTP Client | Axios |
| Security | Helmet + CORS |
| Payment (v2) | Paystack (account pending — do NOT use another gateway) |
| Infra | Docker + Docker Compose |

---

## Ports

| Service | Port |
|---------|------|
| Vite dev server (frontend) | 5173 |
| Express API (backend) | 5000 |
| PostgreSQL | 5432 |

---

## Request Lifecycle

```
Client Request
  ↓ Helmet → CORS → express.json()
  ↓ verifyToken (JWT)
  ↓ checkStatus (DB: block SUSPENDED)
  ↓ [isAdmin if admin route]
  ↓ Controller (Prisma queries)
  ↓ JSON Response
```

---

## Auth Middleware Chain

| Middleware | What it does |
|-----------|-------------|
| `verifyToken` | Decodes JWT, sets `req.user` |
| `checkStatus` | Queries DB, blocks suspended users |
| `isAdmin` | Asserts `req.user.role === 'ADMIN'` |
| `protect` | = verifyToken + checkStatus (combined) |

---

## API Route Prefixes

| Prefix | Auth | Who uses it |
|--------|------|-------------|
| `/api/health` | None | Health check |
| `/api/auth` | None | Register, Login |
| `/api/products` | None | Public product listing |
| `/api/orders` | `protect` | Customer order operations |
| `/api/admin` | `protect + isAdmin` | User management |
| `/api/admin/products` | `protect + isAdmin` | Product CRUD |
| `/api/admin/orders` | `protect + isAdmin` | Orders, payments, cancellations, audit |

---

## Database Model Summary

| Model | Unique Constraints | Key Relations |
|-------|--------------------|---------------|
| `User` | email | → Orders (1:N) |
| `Product` | unique_code (8-char alphanum) | → OrderItems, PaymentRule |
| `Order` | — | → User, OrderItems, PaymentTransactions, CancellationRequest |
| `OrderItem` | — | → Order, Product |
| `PaymentTransaction` | — | → Order |
| `CancellationRequest` | order_id (1:1) | → Order |
| `PaymentRule` | name | → Products (1:N), SetNull on delete |
| `AuditLog` | — | Insert-only; immutable |

---

## Enums Quick Reference

```
Role:               ADMIN | CUSTOMER
Status:             ACTIVE | SUSPENDED
ProductType:        SINGLE | COMBO
PaymentStatus:      PENDING → PARTIALLY_PAID → PAID | OVERDUE
CancellationStatus: NONE → REQUESTED → APPROVED/REJECTED → REFUNDED
```

---

## Frontend File Map

| File | Purpose |
|------|---------|
| `App.jsx` | Route definitions; admin/shop split |
| `context/CartContext.jsx` | Global cart state + drawer open/close |
| `pages/ProductGallery.jsx` | Shop landing (Navbar + Hero + Categories + Products) |
| `pages/ProductDetails.jsx` | Single product detail |
| `pages/CustomerAuth.jsx` | Login / Register |
| `pages/CustomerProfile.jsx` | Order history, payments, cancellations |
| `pages/AdminDashboard.jsx` | Admin tab shell |
| `components/shop/CartDrawer.jsx` | Cart UI + order placement + payment |
| `components/admin/OverviewTab.jsx` | Dashboard stats |
| `components/admin/ProductsTab.jsx` | Product CRUD |
| `components/admin/OrdersTab.jsx` | Order management |
| `components/admin/OverdueTab.jsx` | Overdue + penalty management |
| `components/admin/PaymentRulesTab.jsx` | Payment rule templates |
| `components/admin/CancellationsTab.jsx` | Cancellation review + refund |
| `components/admin/AuditLogTab.jsx` | Immutable audit log viewer |
| `components/admin/UsersTable.jsx` | User list + suspend/reactivate |

---

## Backend File Map

| File | Purpose |
|------|---------|
| `src/index.js` | Express app, middleware, route registration |
| `src/middleware/auth.js` | verifyToken, checkStatus, isAdmin, protect |
| `src/utils/prisma.js` | Singleton PrismaClient |
| `src/controllers/authController.js` | Register, Login |
| `src/controllers/adminController.js` | User management, admin stats |
| `src/controllers/adminProductController.js` | Product CRUD + Cloudinary |
| `src/controllers/adminOrderController.js` | Order status updates |
| `src/controllers/adminPaymentController.js` | Deadline, penalty, rules, audit log |
| `src/controllers/cancellationController.js` | Cancellation workflow |
| `src/controllers/orderController.js` | Customer orders + payment |
| `src/controllers/productController.js` | Public product listing |
| `prisma/schema.prisma` | Database schema (single source of truth) |

---

## Critical Business Rules (Never Break)

1. `unique_code` — 8-char alphanumeric, unique. Generate before insert.
2. Suspension — Blocked at API level on every request, not just login.
3. Payment state — One-way progression only. No reverse transitions.
4. Penalty — Applied only once per order (`penalty_applied` flag guards this).
5. Audit log — Insert-only. No update/delete of AuditLog rows.
6. PaymentRule default — If product has no rule, use `is_default = true` rule.
7. Stock — Decrement on order; reject order if stock = 0.
8. Cancellation — One request per order (unique constraint on `order_id`).
9. **Paystack** — The ONLY approved payment gateway. Do not integrate Stripe/PayPal/etc. Wait for account creation before implementing.

---

## Environment Variables (required)

```
DATABASE_URL      Full PostgreSQL DSN
DB_USER           Postgres username
DB_PASSWORD       Postgres password
DB_NAME           Postgres database name
PORT              Backend port (default: 5000)
NODE_ENV          development | production
JWT_SECRET        Strong random string (min 32 chars)
CLOUDINARY_URL    From Cloudinary dashboard
```

---

## Dev Commands

```bash
# Start everything (Docker)
docker-compose up --build

# Backend only
cd backend && npm run dev

# Frontend only
cd frontend && npm run dev

# DB migration
cd backend && npx prisma migrate dev --name <description>

# Seed admin user
cd backend && node seed-admin.js

# Frontend production build check
cd frontend && npm run build
```

