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
| Database    | PostgreSQL                                     | v16 (Docker image)         |
| Auth        | JSON Web Tokens (JWT) + bcryptjs               |                            |
| Storage     | Cloudinary                                     | SDK v2                     |
| Security    | Helmet (HTTP headers)                          |                            |
| DevOps      | Docker + Docker Compose                        |                            |

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
│   ├── seed-admin.js
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
│   │       │   ├── AuditLogTab.jsx
│   │       │   ├── CancellationsTab.jsx
│   │       │   ├── OrdersTab.jsx
│   │       │   ├── OverdueTab.jsx
│   │       │   ├── OverviewTab.jsx
│   │       │   ├── PaymentRulesTab.jsx
│   │       │   ├── ProductsTab.jsx
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
├── docker-compose.yml
├── AGENTS.md                      # <- You are here
├── prd.md
├── architecture.md
├── architecture-essentials.md
└── .env.example
```

---

## 4. API Surface

All routes are prefixed with `/api`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | None | Health check |
| POST | `/api/auth/register` | None | Customer registration |
| POST | `/api/auth/login` | None | Login (any role) |
| GET | `/api/products` | None | Public product listing |
| GET | `/api/products/:id` | None | Product detail |
| POST | `/api/orders` | protect | Place order |
| GET | `/api/orders` | protect | Customer orders |
| POST | `/api/orders/:id/pay` | protect | Submit payment |
| POST | `/api/orders/:id/cancel` | protect | Request cancellation |
| GET | `/api/admin/users` | protect+isAdmin | List all users |
| PATCH | `/api/admin/users/:id/status` | protect+isAdmin | Suspend/reactivate user |
| GET | `/api/admin/products` | protect+isAdmin | Admin product list |
| POST | `/api/admin/products` | protect+isAdmin | Create product |
| PATCH | `/api/admin/products/:id` | protect+isAdmin | Update product |
| PATCH | `/api/admin/products/:id/status` | protect+isAdmin | Suspend/reactivate product |
| GET | `/api/admin/orders` | protect+isAdmin | All orders |
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
| `User` | id, email, password, role, status, created_at |
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
10. **Paystack (Planned)** — Paystack is the chosen payment gateway for v2. Do NOT implement a different gateway. When the Paystack account is ready, integration goes in `orderController.js` and a new `paystackRoutes.js`. Webhook verification must use the Paystack secret key via env var `PAYSTACK_SECRET_KEY`.
11. **RESTful conventions** — Correct HTTP verbs. No RPC-style routes unless already established.

---

## 8. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Full PostgreSQL connection string |
| `DB_USER` | Yes | Postgres username (Docker Compose) |
| `DB_PASSWORD` | Yes | Postgres password (Docker Compose) |
| `DB_NAME` | Yes | Postgres database name |
| `PORT` | Yes | Backend port (default: 5000) |
| `NODE_ENV` | Yes | `development` or `production` |
| `JWT_SECRET` | Yes | Strong random secret for JWT signing |
| `CLOUDINARY_URL` | Yes | Full Cloudinary URL from dashboard |

---

## 9. Development Setup

### Docker (recommended)
```bash
cp .env.example .env
docker-compose up --build
```

### Local Backend
```bash
cd backend && npm install
npx prisma migrate dev
npm run dev
```

### Local Frontend
```bash
cd frontend && npm install
npm run dev
```

### Seed Admin
```bash
cd backend && node seed-admin.js
```

---

## 10. Agent Coding Rules

1. **Architecture** — Controllers handle logic; routes handle HTTP wiring; middleware handles cross-cutting concerns.
2. **Schema changes** — After editing `schema.prisma`, always run `npx prisma migrate dev --name <description>`.
3. **ESM only** — Backend uses `"type":"module"`. Use `import/export`, never `require`.
4. **Prisma singleton** — Import from `src/utils/prisma.js` only. Never instantiate `PrismaClient` elsewhere.
5. **Error handling** — Wrap async controllers in try/catch. Return `{ error: "..." }` JSON on failure.
6. **No secrets in code** — Never commit API keys, passwords, or JWT secrets.
7. **Tailwind only** — No inline style objects unless absolutely necessary.
8. **State management** — Use `CartContext` for cart state. Do not duplicate cart logic.
9. **Admin routing** — Admin section detected via `window.location.pathname.startsWith('/admin')`. Do not wrap admin in `BrowserRouter`.
10. **Verify before done** — Run frontend build and hit `/api/health` before marking work complete.

