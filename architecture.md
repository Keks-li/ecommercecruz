# Architecture Document
# Cruzaro E-Commerce Platform

**Version:** 1.0  
**Last Updated:** 2026-09-02  

---

## 1. System Overview

Cruzaro is a monorepo containing two discrete applications:

1. **Frontend** — A React SPA (Vite) served separately. Communicates with the backend via REST API.
2. **Backend** — A Node.js/Express REST API. Manages business logic, authentication, and database access via Prisma ORM.

Both applications are containerised and orchestrated using Docker Compose. The database (PostgreSQL 16) is also a Docker-managed service.

```
┌─────────────────────────────────────────────────────┐
│                    Browser / Client                  │
│                                                     │
│   ┌──────────────────────────────────────────────┐  │
│   │         React SPA (Vite, port 5173)          │  │
│   │   Shop UI  |  Admin Dashboard                │  │
│   └───────────────────────┬──────────────────────┘  │
│                           │ HTTP (Axios + JWT)       │
└───────────────────────────┼─────────────────────────┘
                            │
            ┌───────────────▼───────────────┐
            │   Node.js / Express API        │
            │   (Docker, port 5000)          │
            │                               │
            │  ┌────────────────────────┐   │
            │  │   Middleware Layer     │   │
            │  │  Helmet · CORS · Auth  │   │
            │  └────────────┬───────────┘   │
            │               │               │
            │  ┌────────────▼───────────┐   │
            │  │   Route Layer          │   │
            │  │  (6 route modules)     │   │
            │  └────────────┬───────────┘   │
            │               │               │
            │  ┌────────────▼───────────┐   │
            │  │   Controller Layer     │   │
            │  │  (8 controller files)  │   │
            │  └────────────┬───────────┘   │
            │               │               │
            │  ┌────────────▼───────────┐   │
            │  │   Prisma ORM           │   │
            │  └────────────┬───────────┘   │
            └───────────────┼───────────────┘
                            │
            ┌───────────────▼───────────────┐
            │   PostgreSQL 16               │
            │   (Docker, port 5432)         │
            └───────────────────────────────┘

            ┌───────────────────────────────┐
            │   Cloudinary (External)       │
            │   Product image storage       │
            └───────────────────────────────┘
```

---

## 2. Frontend Architecture

### 2.1 Technology
- **Framework:** React 18 with JSX
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS v3
- **Routing:** React Router DOM v7
- **HTTP:** Axios v1.6
- **State:** React Context API (CartContext)

### 2.2 Routing Strategy

`App.jsx` uses a split-routing pattern:

```
window.location.pathname.startsWith('/admin')
    → Render <AdminDashboard /> directly (bypasses BrowserRouter)

All other paths
    → BrowserRouter + React Router Routes
```

| Route | Component | Access |
|-------|-----------|--------|
| `/` | `ProductGallery.jsx` | Public |
| `/category/:categoryName` | `ProductGallery.jsx` | Public |
| `/product/:id` | `ProductDetails.jsx` | Public |
| `/auth` | `CustomerAuth.jsx` | Public |
| `/profile` | `CustomerProfile.jsx` | Protected (JWT in localStorage) |
| `/admin/*` | `AdminDashboard.jsx` | Protected (Admin JWT) |

### 2.3 Component Architecture

```
src/
├── App.jsx                    # Route entry point
├── main.jsx                   # ReactDOM.createRoot
├── index.css                  # Tailwind directives + custom utilities
│
├── context/
│   └── CartContext.jsx         # Global cart: items, add/remove/clear, drawer state
│
├── hooks/                     # Custom React hooks (API calls, form state)
│
├── services/                  # Axios API modules (product, order, auth services)
│
├── pages/
│   ├── ProductGallery.jsx      # Landing: Navbar + Hero + CategoryBar + PromoBanners + ProductCards
│   ├── ProductDetails.jsx      # Single product view + add to cart
│   ├── CustomerAuth.jsx        # Login/Register tabs, JWT storage
│   ├── CustomerProfile.jsx     # Orders, payments, cancellation requests
│   ├── AdminDashboard.jsx      # Tab shell: renders admin tab components
│   └── AdminPanel.jsx          # Admin entry wrapper
│
└── components/
    ├── shop/
    │   ├── Navbar.jsx           # Logo, cart icon, auth links, mobile menu
    │   ├── Hero.jsx             # Hero banner section
    │   ├── CategoryBar.jsx      # Horizontal category filter
    │   ├── PromoBanners.jsx     # Combo/featured product banners
    │   ├── ProductCard.jsx      # Product thumbnail card
    │   ├── CartDrawer.jsx       # Slide-out cart with order placement + payment
    │   └── Footer.jsx           # Site footer
    │
    └── admin/
        ├── OverviewTab.jsx      # Stats: orders, revenue, users, products
        ├── UsersTable.jsx       # User list + suspend/reactivate
        ├── ProductsTab.jsx      # Product CRUD + image upload + payment rule
        ├── OrdersTab.jsx        # Order list + status update
        ├── OverdueTab.jsx       # Overdue orders + deadline/penalty management
        ├── PaymentRulesTab.jsx  # Payment rule template CRUD
        ├── CancellationsTab.jsx # Cancellation request review + refund
        ├── AuditLogTab.jsx      # Read-only audit log viewer
        └── StatusBadge.jsx      # Reusable colored status pill
```

### 2.4 Cart State Flow

```
CartContext
    state: { items: [], isOpen: false }
    actions: addItem, removeItem, updateQty, clearCart, toggleDrawer

ProductCard ──addItem──► CartContext ──isOpen──► CartDrawer
                                                    │
                                                    ▼
                                        POST /api/orders  (place order)
                                        POST /api/orders/:id/pay  (pay)
```

---

## 3. Backend Architecture

### 3.1 Technology
- **Runtime:** Node.js (ESM, `"type":"module"`)
- **Framework:** Express v4
- **ORM:** Prisma v5.11
- **Database:** PostgreSQL 16
- **Auth:** jsonwebtoken + bcryptjs
- **Upload:** multer (multipart)
- **Storage:** Cloudinary SDK v2
- **Security:** helmet, cors

### 3.2 Middleware Stack (per request)

```
Request
  → Helmet (security headers)
  → CORS
  → express.json() (body parser)
  → [Route-specific middleware]
      → verifyToken   (JWT decode + attach req.user)
      → checkStatus   (DB lookup: block SUSPENDED users)
      → isAdmin       (role check for admin routes)
  → Controller handler
  → Error handler middleware
Response
```

### 3.3 Layer Responsibilities

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Route | `src/routes/*.js` | HTTP method + path binding. Applies middleware. Delegates to controller. |
| Controller | `src/controllers/*.js` | Business logic. Validates input. Calls Prisma. Returns JSON response. |
| Middleware | `src/middleware/auth.js` | JWT verification, status enforcement, role enforcement. |
| ORM | `src/utils/prisma.js` | Singleton `PrismaClient`. Imported by all controllers. |
| Schema | `prisma/schema.prisma` | Database schema, enums, relations. |

### 3.4 Controller Summary

| Controller | Responsibility |
|-----------|----------------|
| `authController.js` | Register (hash password, create user), Login (compare hash, sign JWT) |
| `adminController.js` | List users, suspend/reactivate users, admin stats |
| `adminProductController.js` | Product CRUD, Cloudinary upload, status management |
| `adminOrderController.js` | List all orders, update order status |
| `adminPaymentController.js` | Payment deadline, penalty apply/waive, payment history, overdue list, payment rules CRUD, audit log |
| `cancellationController.js` | List cancellations, approve, reject, process refund |
| `orderController.js` | Customer place order, list own orders, submit payment, request cancellation |
| `productController.js` | Public product listing (active only), product detail |

### 3.5 Route Modules

```
/api/health              → inline handler
/api/auth                → authRoutes.js
/api/admin               → adminRoutes.js          (protect + isAdmin)
/api/admin/products      → adminProductRoutes.js   (protect + isAdmin)
/api/admin/orders        → adminOrderRoutes.js     (protect + isAdmin)
/api/products            → productRoutes.js        (public)
/api/orders              → orderRoutes.js          (protect)
```

---

## 4. Database Schema

### 4.1 Entity Relationship Diagram

```
User ──────────────────── Order (1:N, user_id)
                            │
                            ├── OrderItem (1:N, order_id)
                            │       │
                            │       └── Product (N:1, product_id)
                            │                │
                            │                └── PaymentRule (N:1, payment_rule_id, optional)
                            │
                            ├── PaymentTransaction (1:N, order_id)
                            │
                            └── CancellationRequest (1:1, order_id)

AuditLog  (standalone, references user_id loosely)
```

### 4.2 Enum State Machines

**PaymentStatus:**
```
PENDING ──(partial payment)──► PARTIALLY_PAID ──(full payment)──► PAID
   │                                  │
   └──(deadline passed)──────────────►OVERDUE
```

**CancellationStatus:**
```
NONE ──(customer requests)──► REQUESTED
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
               APPROVED                     REJECTED
                    │
                    ▼
               REFUNDED
```

**Order Status (string field):**
```
pending → confirmed → ready → completed
       └──────────────────────────────► cancelled
```

**User/Product Status:**
```
ACTIVE ⟷ SUSPENDED  (admin toggles bidirectionally)
```

### 4.3 Key Constraints
- `Product.unique_code` — `@unique`, 8-char alphanumeric, enforced at DB + application level.
- `CancellationRequest.order_id` — `@unique` (only one active cancellation per order).
- `PaymentRule` → `Product` — `onDelete: SetNull` (deleting a rule nullifies products' FK).
- `AuditLog` — Insert-only. No update or delete operations allowed.

---

## 5. Security Architecture

### 5.1 Authentication Flow

```
Customer Login Request
  → POST /api/auth/login { email, password }
  → authController: bcrypt.compare(password, user.password)
  → jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: '7d' })
  → Response: { token, user }

Protected Request
  → Authorization: Bearer <token>
  → verifyToken: jwt.verify(token, JWT_SECRET) → req.user
  → checkStatus: prisma.user.findUnique → assert status !== SUSPENDED
  → (admin routes) isAdmin: assert req.user.role === 'ADMIN'
  → Controller handler
```

### 5.2 Threat Mitigations

| Threat | Mitigation |
|--------|-----------|
| XSS | Helmet sets `X-XSS-Protection`, `Content-Security-Policy` headers |
| CSRF | JWT in Authorization header (not cookies); no session cookies |
| SQL Injection | Prisma parameterised queries; no raw SQL |
| Broken Auth | JWT expiry enforced; suspended users blocked at runtime |
| Sensitive Data Exposure | Passwords never returned in API responses; stored as bcrypt hash |
| Insecure Config | All secrets via env vars; `.env` gitignored |

---

## 6. Infrastructure & Deployment

### 6.1 Docker Compose Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `postgres` | `postgres:16-alpine` | 5432 | Primary database |
| `backend` | Custom Dockerfile | 5000 | Express API server |

**Startup sequence:**
1. `postgres` starts and passes health check (`pg_isready`).
2. `backend` starts (depends_on: postgres healthy).
3. Backend runs `npx prisma migrate deploy` then `npm run dev`.

### 6.2 Volumes & Networks

- `postgres_data` — Named volume persists database across container restarts.
- `cruzaro_network` — Bridge network; services communicate by container name.
- Backend source code (`./backend/src`, `./backend/prisma`) mounted for hot-reload in development.

### 6.3 Environment Configuration

All sensitive values are injected via environment variables. See `.env.example` for the full list.

| Variable | Used By | Notes |
|----------|---------|-------|
| `DATABASE_URL` | Backend (Prisma) | Full Postgres DSN |
| `JWT_SECRET` | Backend (auth) | Min 32 random chars in production |
| `CLOUDINARY_URL` | Backend (uploads) | From Cloudinary dashboard |
| `PORT` | Backend | Default 5000 |
| `NODE_ENV` | Backend | Affects logging and error detail |

---

## 7. Data Flow: Customer Places Order

```
1. Customer selects products → CartContext.addItem()
2. Customer opens CartDrawer → fills pickup location → clicks "Place Order"
3. CartDrawer → POST /api/orders
   Body: { items: [{product_id, quantity, price}], pickup_region, pickup_district, pickup_city }
4. orderController:
   a. Validate user is not SUSPENDED
   b. Validate each product is ACTIVE and in stock
   c. Begin Prisma transaction:
      - Create Order (total_price, payment_status=PENDING)
      - Create OrderItems (snapshot price at order time)
      - Decrement Product.stock for each item
5. Return { order } to frontend
6. CartContext.clearCart()
7. Customer submits payment → POST /api/orders/:id/pay
   Body: { amount, payment_method, reference, note }
8. orderController:
   a. Create PaymentTransaction
   b. Recalculate amount_paid
   c. Update payment_status (PENDING/PARTIALLY_PAID/PAID)
9. Return updated order
```

---

## 8. Data Flow: Admin Applies Penalty

```
1. Admin opens Overdue tab → GET /api/admin/orders/overdue
2. Selects order → POST /api/admin/orders/:id/apply-penalty
3. adminPaymentController:
   a. Check penalty_applied === false
   b. Look up effective PaymentRule (product rule or default rule)
   c. penalty_amount = total_price * penalty_pct / 100
   d. Update order: penalty_amount, penalty_pct, penalty_applied=true
   e. Write AuditLog: { action: 'APPLY_PENALTY', entity: 'Order', entity_id, old_value, new_value }
4. Return updated order
```

---

## 9. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| ESM throughout backend | Modern Node.js standard; aligns with Vite/React ES module convention |
| Prisma ORM | Type-safe DB access, migration management, and readable schema definition |
| Singleton PrismaClient | Prevents connection pool exhaustion in development with hot-reload |
| CartContext (not Redux) | Application is small; React Context avoids third-party dependency overhead |
| Admin routing via pathname check | Keeps admin section completely independent; avoids auth complexity in router |
| Audit log as insert-only model | Guarantees immutability; no UPDATE/DELETE paths exist for AuditLog |
| PaymentRule cascade SetNull | Prevents orphaned FK references while preserving historical order data |
| Cloudinary for images | Offloads storage, CDN delivery, and image transformation to a managed service |
| Docker health checks | Eliminates race conditions between backend startup and DB readiness |

---

## 10. Planned: Paystack Integration (v2)

> **Status:** Paystack is confirmed as the payment provider. Account creation is pending. No implementation work should begin until the account is active.

### Integration Plan (for when account is ready)

```
Customer confirms order
  → POST /api/orders/:id/paystack/initialize
      → Call Paystack API: POST https://api.paystack.co/transaction/initialize
      → { authorization_url, reference } returned to frontend
  → Frontend redirects to authorization_url (Paystack hosted page)
  → Customer pays on Paystack
  → Paystack redirects to callback URL
  → Paystack sends webhook: POST /api/webhooks/paystack
      → Verify X-Paystack-Signature header (HMAC-SHA512, PAYSTACK_SECRET_KEY)
      → On event "charge.success": update PaymentTransaction + PaymentStatus
```

### Files to add/modify
- `src/routes/paystackRoutes.js` — webhook receiver + initialize endpoint
- `src/controllers/paystackController.js` — Paystack API calls + signature verification
- `src/index.js` — register `/api/webhooks/paystack` and `/api/orders/:id/paystack`
- `.env` — add `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`, `PAYSTACK_CALLBACK_URL`

### Environment Variables (to add)
| Variable | Purpose |
|----------|---------|
| `PAYSTACK_SECRET_KEY` | Server-side secret for API calls + webhook verification |
| `PAYSTACK_PUBLIC_KEY` | Client-side key for Paystack.js (frontend) |
| `PAYSTACK_CALLBACK_URL` | URL Paystack redirects to after payment |

### Security Rules
- **Always** verify the `X-Paystack-Signature` header on every webhook. Reject unverified requests with 400.
- Never log or expose `PAYSTACK_SECRET_KEY`.
- Use `crypto.createHmac('sha512', secret).update(rawBody).digest('hex')` for verification.
- Webhook endpoint must parse raw body (not JSON-parsed) for correct HMAC.
