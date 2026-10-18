# AGENTS.md — Cruzaro E-Commerce Platform

> **Read this file first** before modifying any code. It is the single source of truth for AI agents working in this repository.

---

## 1. Project Identity

| Field       | Value                                          |
|-------------|------------------------------------------------|
| **Name**    | Cruzaro                                        |
| **Type**    | Full-stack e-commerce web application          |
| **Roles**   | `ADMIN` · `CUSTOMER`                           |
| **Status**  | Active development                             |

---

## 2. Tech Stack

| Layer       | Technology                                      | Version / Notes            |
|-------------|------------------------------------------------|----------------------------|
| Frontend    | React (Vite)                                   | v18 · JSX · ES Modules     |
| Styling     | Tailwind CSS                                   | v3.3                       |
| Routing     | React Router DOM                               | v7                         |
| HTTP Client | Axios                                          | v1.6                       |
| Backend     | Node.js + Express                              | ESM (`"type":"module"`)    |
| ORM         | Prisma                                         | v5.11                      |
| Database    | PostgreSQL (Supabase managed)                  | v17 · eu-west-2 (London)   |
| Auth        | JSON Web Tokens (JWT) + bcryptjs               |                            |
| Storage     | Cloudinary                                     | SDK v2 · cloud: qfpjrjxc   |
| Security    | Helmet (HTTP headers)                          |                            |
| Hosting     | Frontend → Cloudflare Pages · Backend → Render/Railway |              |

---

## 3. Repository Structure

```
ecommercecruz/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Single source of truth for DB schema
│   │   └── migrations/            # Auto-generated migration history
│   ├── src/
│   │   ├── index.js               # Express app entry point (port 5000)
│   │   ├── controllers/           # Business logic layer
│   │   │   ├── adminController.js
│   │   │   ├── adminOrderController.js
│   │   │   ├── adminPaymentController.js
│   │   │   ├── adminProductController.js
│   │   │   ├── authController.js
│   │   │   ├── cancellationController.js
│   │   │   ├── orderController.js
│   │   │   └── productController.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── adminRoutes.js
│   │   │   ├── adminProductRoutes.js
│   │   │   ├── adminOrderRoutes.js
│   │   │   ├── productRoutes.js
│   │   │   └── orderRoutes.js
│   │   └── utils/
│   │       └── prisma.js
│   ├── seed-admin.js          # legacy (kept for reference)
│   ├── seed_admin.js          # ✅ USE THIS — seeds admin@cruzaro.com
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── context/CartContext.jsx
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── pages/
│   │   │   ├── ProductGallery.jsx
│   │   │   ├── ProductDetails.jsx
│   │   │   ├── CustomerAuth.jsx
│   │   │   ├── CustomerProfile.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── AdminPanel.jsx
│   │   └── components/
│   │       ├── admin/
│   │       │   ├── AuditLogDetails.jsx
│   │       │   ├── AuditLogTab.jsx
│   │       │   ├── CancellationsTab.jsx
│   │       │   ├── OrderDetailsModal.jsx
│   │       │   ├── OrdersTab.jsx
│   │       │   ├── OverdueTab.jsx
│   │       │   ├── OverviewTab.jsx
│   │       │   ├── PaymentRulesTab.jsx
│   │       │   ├── ProductsTab.jsx
│   │       │   ├── RevenueRealizedTab.jsx
│   │       │   ├── StatusBadge.jsx
│   │       │   └── UsersTable.jsx
│   │       └── shop/
│   │           ├── CartDrawer.jsx
│   │           ├── CategoryBar.jsx
│   │           ├── Footer.jsx
│   │           ├── Hero.jsx
│   │           ├── Navbar.jsx
│   │           ├── ProductCard.jsx
│   │           └── PromoBanners.jsx
│   └── package.json
│
├── docker-compose.yml             # legacy — NOT used in production
├── AGENTS.md                      # <- You are here
├── prd.md
├── architecture.md
├── architecture-essentials.md
├── render.yaml
├── railway.toml
└── .env.example
```

---

## 4. API Surface

All routes are prefixed with `/api`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | None | Health check |
| POST | `/api/auth/register` | None | Customer registration (supports Ghana phone & name) |
| POST | `/api/auth/login` | None | Login with email or phone number (any role) |
| POST | `/api/auth/social-login` | None | Social sign-in (Google & Apple OAuth exchange/link) |
| PATCH | `/api/auth/profile` | protect | Update customer name and Ghana phone number |
| GET | `/api/products` | None | Public product listing |
| GET | `/api/products/:id` | None | Product detail |
| GET | `/api/products/payment-policy` | None | Active default payment rules policy |
| POST | `/api/orders` | protect | Place order |
| POST | `/api/orders/paystack/initialize` | protect | Initialize Paystack checkout session |
| GET | `/api/orders` | protect | Customer orders |
| POST | `/api/orders/:id/pay` | protect | Submit payment (manual fallback) |
| POST | `/api/orders/:id/paystack/initialize` | protect | Initialize Paystack balance payment |
| POST | `/api/orders/:id/cancel` | protect | Request cancellation |
| GET | `/api/paystack/public-key` | None | Public key for Paystack Inline JS |
| POST | `/api/paystack/initialize-checkout` | protect | Initialize Paystack checkout session |
| POST | `/api/paystack/orders/:id/initialize` | protect | Initialize Paystack balance payment |
| GET | `/api/paystack/verify/:reference` | protect | Verify Paystack transaction with API |
| POST | `/api/webhooks/paystack` | None | Paystack webhook receiver (HMAC-SHA512) |
| POST | `/api/paystack/webhook` | None | Paystack webhook receiver alias |
| GET | `/api/admin/stats` | protect+isAdmin | Dashboard statistics & metrics |
| GET | `/api/admin/revenue-realized` | protect+isAdmin | Realized revenue, cash inflows & ledger |
| GET | `/api/admin/users` | protect+isAdmin | List all users |
| PATCH | `/api/admin/users/:id/status` | protect+isAdmin | Suspend/reactivate user |
| GET | `/api/admin/products` | protect+isAdmin | Admin product list |
| POST | `/api/admin/products` | protect+isAdmin | Create product |
| PATCH | `/api/admin/products/:id` | protect+isAdmin | Update product |
| PATCH | `/api/admin/products/:id/status` | protect+isAdmin | Suspend/reactivate product |
| GET | `/api/admin/orders` | protect+isAdmin | All orders |
| GET | `/api/admin/orders/:id` | protect+isAdmin | Single order full detail |
| PATCH | `/api/admin/orders/:id/status` | protect+isAdmin | Update order status |
| GET | `/api/admin/orders/overdue` | protect+isAdmin | Overdue payment orders |
| POST | `/api/admin/orders/:id/set-deadline` | protect+isAdmin | Set payment deadline |
| POST | `/api/admin/orders/:id/apply-penalty` | protect+isAdmin | Apply penalty |
| POST | `/api/admin/orders/:id/waive-penalty` | protect+isAdmin | Waive penalty |
| GET | `/api/admin/orders/:id/payment-history` | protect+isAdmin | Payment history |
| GET | `/api/admin/orders/payment-rules` | protect+isAdmin | List payment rules |
| POST | `/api/admin/orders/payment-rules` | protect+isAdmin | Create payment rule |
| PUT | `/api/admin/orders/payment-rules/:id` | protect+isAdmin | Update payment rule |
| DELETE | `/api/admin/orders/payment-rules/:id` | protect+isAdmin | Delete payment rule |
| GET | `/api/admin/orders/cancellations` | protect+isAdmin | List cancellation requests |
| POST | `/api/admin/orders/cancellations/:id/approve` | protect+isAdmin | Approve cancellation |
| POST | `/api/admin/orders/cancellations/:id/reject` | protect+isAdmin | Reject cancellation |
| POST | `/api/admin/orders/cancellations/:id/refund` | protect+isAdmin | Process refund |
| GET | `/api/admin/orders/audit-logs` | protect+isAdmin | Audit log |

---

## 5. Data Models (Prisma)

### Enums
- **Role:** `ADMIN` | `CUSTOMER`
- **Status:** `ACTIVE` | `SUSPENDED`
- **ProductType:** `SINGLE` | `COMBO`
- **PaymentStatus:** `PENDING` | `PARTIALLY_PAID` | `PAID` | `OVERDUE`
- **CancellationStatus:** `NONE` | `REQUESTED` | `APPROVED` | `REJECTED` | `REFUNDED`

### Models
| Model | Key Fields |
|-------|-----------|
| `User` | id, email, password (optional), phone (@unique, optional), name, auth_provider (`LOCAL` · `GOOGLE` · `APPLE`), avatar_url, role, status, created_at |
| `Product` | id, name, description, price, **unique_code** (8-char alphanumeric), status, type, category, image_url, stock, payment_rule_id |
| `Order` | id, user_id, total_price, amount_paid, penalty_amount, payment_status, cancellation_status, pickup_region/district/city |
| `OrderItem` | id, order_id, product_id, quantity, price |
| `PaymentTransaction` | id, order_id, amount, payment_method, reference, note |
| `CancellationRequest` | id, order_id, requested_by, reason, cancellation_fee_pct, refund_amount, status |
| `PaymentRule` | id, name, is_default, default_deadline_days, default_penalty_pct, grace_period_days, default_cancel_fee_pct, enable_recurring |
| `AuditLog` | id, user_id, action, entity, entity_id, old_value, new_value, ip_address |

---

## 6. Auth & Security Rules

1. **JWT Bearer token** — All protected routes require `Authorization: Bearer <token>`.
2. **Middleware chain** — `protect` = `verifyToken` → `checkStatus` (blocks suspended users).
3. **Admin guard** — `isAdmin` enforces `role === 'ADMIN'` after `protect`.
4. **Suspension enforced at runtime** — DB is checked on every request; suspended users are blocked immediately, not just at login.
5. **Secrets** — Always loaded from environment variables. Never hardcoded.

---

## 7. Business Rules (MUST enforce)

1. **Unique product codes** — Every product must have a unique 8-character alphanumeric `unique_code`. Generate before insert; reject duplicates.
2. **Suspension propagation** — Suspended users cannot place orders. Suspended products cannot be purchased. Enforce at API level.
3. **Payment state machine** — `PENDING → PARTIALLY_PAID → PAID` or `→ OVERDUE`. No backwards transitions.
4. **Cancellation workflow** — Customer requests → Admin approves/rejects → Admin processes refund (three distinct API calls).
5. **Penalty logic** — Penalty applied once per order (`penalty_applied` flag). Waiving resets flag and zeroes `penalty_amount`.
6. **Audit trail** — All admin mutations must write to `AuditLog`. Audit rows are immutable.
7. **Payment rules** — Attach a `PaymentRule` to a product. If none attached, use the rule where `is_default = true`.
8. **Cloudinary** — Product images uploaded via multipart. `image_url` stores the Cloudinary secure URL.
9. **Stock** — Decrement `stock` on order placement. Never allow orders for out-of-stock items.
10. **Paystack Payment Gateway** — Paystack is the primary online payment gateway for Ghana (`GHS`). Security measures strictly enforced:
    - **Webhook Verification:** Cryptographic HMAC-SHA512 verification using `crypto.timingSafeEqual` against `process.env.PAYSTACK_SECRET_KEY` on raw request body (`req.rawBody`).
    - **Secret Key Isolation:** `PAYSTACK_SECRET_KEY` stays strictly on backend; never exposed to client or API logs.
    - **Idempotency Protection:** Double-check transaction references in `PaymentTransaction` before crediting to prevent double-crediting across webhooks and browser callbacks.
    - **Server-Side Validation:** Amount (in pesewas) and currency (`GHS`) verified against database prices and order balance; client-side amounts are never trusted.
    - **Stock Safeguard:** Product stock decremented atomically upon order creation/placement (Rule 9).
11. **RESTful conventions** — Correct HTTP verbs. No RPC-style routes unless already established.

---

## 8. Environment Variables

All env vars live in `backend/.env` (local dev). Production env vars are set in the hosting dashboard (Render / Railway). There is **no** Docker Compose env setup — `DB_USER`, `DB_PASSWORD`, `DB_NAME` are no longer used.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Supabase PostgreSQL connection string (see formats below) |
| `PORT` | Yes | Backend port (default: `5000`) |
| `NODE_ENV` | Yes | `development` or `production` |
| `JWT_SECRET` | Yes | Strong random 128-char hex secret for JWT signing |
| `CLOUDINARY_URL` | Yes | `cloudinary://<key>:<secret>@<cloud_name>` |
| `ALLOWED_ORIGINS` | Yes (prod) | Comma-separated allowed CORS origins. Empty = allow all (local dev only) |
| `PAYSTACK_SECRET_KEY` | Yes (payments) | Paystack Secret Key (`sk_test_...` or `sk_live_...`) for API calls & HMAC webhook verification |
| `PAYSTACK_PUBLIC_KEY` | Yes (payments) | Paystack Public Key (`pk_test_...` or `pk_live_...`) for Paystack Inline JS popup |
| `PAYSTACK_CALLBACK_URL` | Optional | Customer redirect return URL after hosted payment (default: `/profile`) |

### DATABASE_URL formats

```bash
# Local dev & Prisma migrations — Direct connection (port 5432)
DATABASE_URL=postgresql://postgres.nmknkskyzmlocnjbrtub:<password>@aws-0-eu-west-2.pooler.supabase.com:5432/postgres

# Production (Render/Railway) — Transaction Pooler (port 6543)
DATABASE_URL=postgresql://postgres.nmknkskyzmlocnjbrtub:<password>@aws-0-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

> ⚠️ Special characters in the password must be URL-encoded (`@` → `%40`, `$` → `%24`).

---

## 8a. Supabase Project

| Field | Value |
|---|---|
| **Project name** | online cart |
| **Project ref** | `nmknkskyzmlocnjbrtub` |
| **Region** | eu-west-2 (London) |
| **Postgres version** | 17.11 |
| **Dashboard** | https://supabase.com/dashboard/project/nmknkskyzmlocnjbrtub |
| **DB host** | `db.nmknkskyzmlocnjbrtub.supabase.co` |

### Tables (created via direct SQL migration — NOT `prisma migrate`)
| Table | Notes |
|---|---|
| `PaymentRule` | Seeded with 1 default rule |
| `User` | |
| `Product` | |
| `Order` | |
| `OrderItem` | |
| `PaymentTransaction` | |
| `CancellationRequest` | |
| `AuditLog` | |
| `_prisma_migrations` | Prisma-compatible tracking table |

> ⚠️ RLS (Row Level Security) is **disabled** on all tables. Safe because the backend connects via the service-role/direct connection string — not the anon key. Do NOT enable RLS without adding appropriate policies first.

---

## 9. Development Setup

> Docker is **not** used for local development. The database is Supabase (managed cloud Postgres).

### Prerequisites
- Node.js v18+
- A configured `backend/.env` (copy from `backend/.env.example` and fill in real values)
- PowerShell execution policy set: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`

### Local Backend
```bash
cd backend
npm install          # also runs: prisma generate
npm run dev          # starts nodemon on port 5000
```

### Local Frontend
```bash
cd frontend
npm install --legacy-peer-deps    # --legacy-peer-deps required (eslint peer conflict)
npm run dev          # starts Vite on port 3000
```

### Seed Admin
```bash
# From the backend/ directory:
node seed_admin.js
# Creates: admin@cruzaro.com / admin123
# Outputs a localStorage token command for instant browser login
```

### Schema changes
```bash
# Edit backend/prisma/schema.prisma, then:
npx prisma db push       # pushes schema to Supabase WITHOUT migrations
# OR for tracked migrations:
npx prisma migrate dev --name <description>
```

### Verify everything is working
```bash
curl http://localhost:5000/api/health
# Expected: {"status":"Backend is running"}
```

---

## 10. Agent Coding Rules

1. **Architecture** — Controllers handle logic; routes handle HTTP wiring; middleware handles cross-cutting concerns.
2. **Schema changes** — After editing `schema.prisma`, run `npx prisma db push` (for Supabase dev) or `npx prisma migrate dev --name <description>` (for tracked migrations). The Prisma `binaryTargets` must be `["native", "debian-openssl-3.0.x"]` — do NOT use `linux-openssl-3.0.x` (invalid).
3. **ESM only** — Backend uses `"type":"module"`. Use `import/export`, never `require`.
4. **Prisma singleton** — Import from `src/utils/prisma.js` only. Never instantiate `PrismaClient` elsewhere.
5. **Error handling** — Wrap async controllers in try/catch. Return `{ error: "..." }` JSON on failure.
6. **No secrets in code** — Never commit API keys, passwords, or JWT secrets.
7. **Tailwind only** — No inline style objects unless absolutely necessary.
8. **State management** — Use `CartContext` for cart state. Do not duplicate cart logic.
9. **Admin routing** — Admin section detected via `window.location.pathname.startsWith('/admin')`. Do not wrap admin in `BrowserRouter`.
10. **Verify before done** — Run frontend build and hit `/api/health` before marking work complete.

