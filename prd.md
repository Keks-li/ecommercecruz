# Product Requirements Document (PRD)
# Cruzaro E-Commerce Platform

**Version:** 1.0  
**Last Updated:** 2026-09-02  
**Status:** Active Development  

---

## 1. Product Overview

### 1.1 Vision
Cruzaro is a full-stack e-commerce platform built for a single-vendor business model. It provides customers with a clean shopping experience—browsing, ordering, and paying for products—while giving administrators comprehensive tools to manage inventory, users, orders, payments, and compliance.

### 1.2 Goals
- Provide customers a seamless, mobile-friendly product discovery and ordering flow.
- Give administrators full control over the product catalog, user lifecycle, and financial operations.
- Enforce financial discipline through configurable payment rules, penalty logic, and audit trails.
- Support a sustainable pickup-based fulfillment model with regional location data.

### 1.3 Non-Goals (v1)
- No third-party payment gateway integration in v1 — Paystack is planned for v2 (pending account setup). Current payments are manual/bank transfer.
- No multi-vendor marketplace functionality.
- No real-time chat/support system.
- No mobile native apps (web-first only).

---

## 2. User Roles

### 2.1 Customer
A registered buyer who can browse, order, and manage their own orders.

**Capabilities:**
- Register and log in with email/password.
- Browse all active products (filtered by category, type).
- View product details (image, description, price, unique code, stock).
- Add products to cart and place an order.
- Specify pickup region/district/city at checkout.
- Pay partially or in full against an open order.
- View order history and payment status.
- Request cancellation of an order.
- Update profile information.

**Restrictions:**
- Cannot access admin routes or data.
- Cannot place orders if account is `SUSPENDED`.
- Cannot purchase `SUSPENDED` products.
- Cannot order out-of-stock items.

### 2.2 Admin
A privileged operator who manages the entire platform.

**Capabilities:**
- Log in via dedicated admin login page.
- View platform overview (stats, recent activity).
- **Users:** List, suspend, and reactivate customer accounts.
- **Products:** Create, edit, suspend/reactivate products. Attach images via Cloudinary upload. Assign payment rules.
- **Orders:** View all orders. Update order status. Set payment deadlines.
- **Payments:** Apply or waive penalties on overdue orders. View per-order payment history.
- **Payment Rules:** Create, edit, and delete reusable payment rule templates (deadline days, penalty %, grace period, cancellation fee %, refund window).
- **Cancellations:** Review, approve, reject, and process refunds for cancellation requests.
- **Audit Logs:** View immutable audit trail of all admin actions.

**Restrictions:**
- Admin accounts are seeded manually (no public admin registration).

---

## 3. Feature Requirements

### 3.1 Authentication & Authorization

| ID | Requirement | Priority |
|----|-------------|----------|
| AUTH-01 | Customers can register with email + password. Passwords are hashed with bcrypt. | Must Have |
| AUTH-02 | All users (Admin + Customer) log in via `/api/auth/login` and receive a signed JWT. | Must Have |
| AUTH-03 | JWT is validated on every protected request via Bearer token header. | Must Have |
| AUTH-04 | Suspended users are blocked from all protected endpoints at runtime (not just login). | Must Have |
| AUTH-05 | Admin routes require both a valid JWT and `role === ADMIN`. | Must Have |

### 3.2 Product Catalog

| ID | Requirement | Priority |
|----|-------------|----------|
| PROD-01 | Every product has a unique 8-character alphanumeric code (`unique_code`). | Must Have |
| PROD-02 | Products support two types: `SINGLE` (individual item) and `COMBO` (bundle). | Must Have |
| PROD-03 | Products have a category field for filtering. | Must Have |
| PROD-04 | Product images are stored in Cloudinary. Upload happens during product creation/edit. | Must Have |
| PROD-05 | Admins can suspend products. Suspended products are hidden from public listing. | Must Have |
| PROD-06 | Products track stock count. Ordering reduces stock. Orders for zero-stock are rejected. | Must Have |
| PROD-07 | A `PaymentRule` can be optionally linked to a product for custom payment terms. | Should Have |
| PROD-08 | Public product listing supports filtering by category and product type. | Must Have |

### 3.3 Order Management

| ID | Requirement | Priority |
|----|-------------|----------|
| ORD-01 | Customers place orders with one or more products (quantity + price captured at order time). | Must Have |
| ORD-02 | Customers provide pickup location (region, district, city) at checkout. | Must Have |
| ORD-03 | `total_price` is computed from `sum(item.quantity * item.price)` at order creation. | Must Have |
| ORD-04 | Order status lifecycle: `pending → confirmed → ready → completed` (or `cancelled`). | Must Have |
| ORD-05 | Admins can update order status at any point. | Must Have |
| ORD-06 | Customers can view their full order history with current payment and cancellation status. | Must Have |

### 3.4 Payment System

| ID | Requirement | Priority |
|----|-------------|----------|
| PAY-01 | Payments are recorded as `PaymentTransaction` entries. Currently manual (bank/cash transfer). **Paystack integration is planned** — account creation is pending. | Must Have |
| PAY-02 | Payment status follows: `PENDING → PARTIALLY_PAID → PAID` or `→ OVERDUE`. | Must Have |
| PAY-03 | Admins set a payment deadline per order. | Must Have |
| PAY-04 | Orders past their deadline with unpaid balance transition to `OVERDUE`. | Must Have |
| PAY-05 | Admins can apply a penalty (%) to an overdue order once (`penalty_applied` flag). | Must Have |
| PAY-06 | Admins can waive a penalty, zeroing `penalty_amount` and resetting the flag. | Must Have |
| PAY-07 | Full payment history (all transactions) is accessible per order for admins. | Must Have |
| PAY-08 | Overdue orders are surfaced in a dedicated admin dashboard tab. | Should Have |

### 3.5 Payment Rules

| ID | Requirement | Priority |
|----|-------------|----------|
| PRULE-01 | Admins can create named `PaymentRule` templates. | Must Have |
| PRULE-02 | Rules include: deadline days, penalty %, grace period days, cancellation fee %, max refund days. | Must Have |
| PRULE-03 | One rule can be marked `is_default = true`. It applies to products without an explicit rule. | Must Have |
| PRULE-04 | Rules support optional recurring penalty (penalty applied on a frequency, e.g., monthly). | Should Have |
| PRULE-05 | Deleting a rule sets `payment_rule_id = NULL` on affected products (cascade SetNull). | Must Have |

### 3.6 Cancellation & Refund

| ID | Requirement | Priority |
|----|-------------|----------|
| CANCEL-01 | Customers submit a cancellation request with a reason. | Must Have |
| CANCEL-02 | Only one active cancellation request is allowed per order. | Must Have |
| CANCEL-03 | Admins review, approve, or reject cancellation requests with an optional admin note. | Must Have |
| CANCEL-04 | Approval computes refund amount based on cancellation fee (from PaymentRule or fixed). | Must Have |
| CANCEL-05 | Admin triggers the refund step separately after approval. | Must Have |
| CANCEL-06 | Cancellation status lifecycle: `NONE → REQUESTED → APPROVED/REJECTED → REFUNDED`. | Must Have |

### 3.7 Admin Dashboard

| ID | Requirement | Priority |
|----|-------------|----------|
| ADMIN-01 | Overview tab: summary stats (total orders, revenue, pending payments, active products). | Must Have |
| ADMIN-02 | Users tab: searchable/filterable user table with suspend/reactivate actions. | Must Have |
| ADMIN-03 | Products tab: product management with create/edit/suspend/image upload. | Must Have |
| ADMIN-04 | Orders tab: full order list with status management. | Must Have |
| ADMIN-05 | Overdue tab: list of orders past payment deadline. | Must Have |
| ADMIN-06 | Payment Rules tab: CRUD for payment rule templates. | Must Have |
| ADMIN-07 | Cancellations tab: review and action cancellation requests. | Must Have |
| ADMIN-08 | Audit Log tab: read-only, reverse-chronological log of all admin actions. | Must Have |

### 3.8 Audit Trail

| ID | Requirement | Priority |
|----|-------------|----------|
| AUDIT-01 | Every admin mutation (create/update/delete/status change) writes an `AuditLog` row. | Must Have |
| AUDIT-02 | Audit log records: user_id, action, entity type, entity id, old value, new value, IP address. | Must Have |
| AUDIT-03 | Audit log rows are immutable. No delete or update endpoints exist for `AuditLog`. | Must Have |

### 3.9 Paystack Payment Gateway *(v2 — Pending Account Setup)*

> **Paystack is the confirmed, approved payment provider for Cruzaro.** Integration is blocked only by account creation. No other gateway should be implemented.

| ID | Requirement | Priority |
|----|-------------|----------|
| PAY-PS-01 | Integrate Paystack as the primary online payment channel. Replace manual bank-transfer flow with Paystack-hosted checkout. | Must Have (v2) |
| PAY-PS-02 | Backend initialises a Paystack transaction via `POST /api/orders/:id/paystack/initialize`. Returns `authorization_url` and `reference` to the frontend. | Must Have (v2) |
| PAY-PS-03 | Frontend redirects customer to the Paystack `authorization_url` (hosted payment page). No custom card UI needed. | Must Have (v2) |
| PAY-PS-04 | Paystack sends a `charge.success` webhook to `POST /api/webhooks/paystack` after successful payment. | Must Have (v2) |
| PAY-PS-05 | Backend verifies the `X-Paystack-Signature` header on every webhook using HMAC-SHA512 with `PAYSTACK_SECRET_KEY`. Unverified webhooks are rejected with HTTP 400. | Must Have (v2) |
| PAY-PS-06 | On verified `charge.success` webhook: create a `PaymentTransaction`, update `amount_paid`, advance `PaymentStatus` accordingly. | Must Have (v2) |
| PAY-PS-07 | Paystack `reference` is stored on the `PaymentTransaction` row for reconciliation. | Must Have (v2) |
| PAY-PS-08 | Paystack public key is exposed to the frontend via a dedicated env var (`PAYSTACK_PUBLIC_KEY`). Secret key is never sent to the client. | Must Have (v2) |
| PAY-PS-09 | Admin payment history view shows whether each transaction was `MANUAL` or `PAYSTACK`. | Should Have (v2) |
| PAY-PS-10 | Manual payment recording (PAY-01) remains available as an admin-only fallback even after Paystack is live. | Should Have (v2) |

**Required environment variables (add when account is ready):**

| Variable | Purpose |
|----------|---------|
| `PAYSTACK_SECRET_KEY` | API calls + webhook HMAC verification (server-side only) |
| `PAYSTACK_PUBLIC_KEY` | Frontend Paystack.js initialisation |
| `PAYSTACK_CALLBACK_URL` | URL Paystack redirects customer to after payment |

---

## 4. UX Requirements

### 4.1 Shop (Customer-Facing)
- Responsive, mobile-first design.
- Sticky navigation bar with cart icon showing item count.
- Hero section on the landing page.
- Category filter bar for product browsing.
- Promotional banners section for combo/featured products.
- Product cards with image, name, price, and quick-add-to-cart.
- Slide-out cart drawer with item management and order placement.
- Fixed bottom nav bar on mobile.
- Dedicated product detail page.
- Customer auth page (login/register toggle).
- Customer profile page with order history and payment status.
- *(v2)* "Pay Now" button triggers Paystack redirect. Customer returns to profile page after payment; status auto-refreshes.

### 4.2 Admin (Admin-Facing)
- Tab-based single-page dashboard (no page reloads between tabs).
- Data tables with sort, filter, and pagination.
- Modal dialogs for create/edit forms.
- Status badges with color coding (ACTIVE=green, SUSPENDED=red, OVERDUE=orange, etc.).
- Confirmation dialogs for destructive actions.
- *(v2)* Payment history distinguishes MANUAL vs PAYSTACK transactions visually.

---

## 5. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Security | HTTPS in production. Helmet middleware on all responses. JWT expiry enforced. |
| Performance | Public product listing must respond < 500ms under normal load. |
| Reliability | Docker Compose health checks ensure backend starts only after DB is ready. |
| Maintainability | Prisma migrations as the only schema change mechanism. ESM throughout backend. |
| Observability | AuditLog provides full admin action history. Console errors logged for unexpected failures. |
| Portability | Docker Compose for one-command environment setup on any host. |

---

## 6. Out of Scope (Future Roadmap)

- **Paystack payment gateway** — Paystack is the chosen provider. Integration will be added once the Paystack account is created. This is the top-priority roadmap item.
- Email notifications (order confirmation, payment reminders).
- Product reviews and ratings.
- Discount codes and promotions engine.
- Multi-language / i18n support.
- Analytics dashboard with charts.
- Delivery tracking integration.

