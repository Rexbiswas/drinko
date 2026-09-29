# ☕ DRINKO — Full-Stack Artisan Café Web Application

> **Production-Style Café Platform** with Vanilla HTML/CSS/JS Frontend, Node.js + Express Backend, MongoDB + Mongoose Database, JWT Authentication, Real-Time Socket.IO Kitchen Display System, Contactless QR Table Ordering, Loyalty Rewards, and Admin Command Center.

---

## 🌟 Highlights & Architecture

Drinko transforms an artisan café storefront into a complete, real-time hospitality and ordering platform while **100% preserving** the existing Drinko visual identity, luxury animations, micro-interactions, responsive CSS, and asset architecture.

```text
Drinko/
├── index.html                 # Hero showcase, bestsellers preview, cart drawer, wishlist drawer, auth modal
├── pages/
│   ├── menu.html             # Dynamic category-filtered menu with live DB hydration
│   ├── delivery.html         # Delivery calculator, coverage zones, and FAQ accordion
│   ├── reviews.html          # Verified customer reviews with dynamic DB submission
│   ├── profile.html          # Full customer account (VIP pass, orders, addresses, rewards, settings)
│   └── order.html            # Contactless QR Table Ordering (?table=07) with live kitchen status
│
├── admin/                    # Admin & Kitchen Command Center
│   ├── index.html            # Kitchen Display Kanban, Analytics KPIs, Orders, Products, Inventory, Coupons
│   ├── admin.css             # Obsidian & Amber luxury café administration theme
│   └── admin.js              # Real-time Socket.IO board, status progressions & management logic
│
├── scripts/
│   ├── api.js                # Centralized DrinkoAPI client (Fetch, JWT auth, endpoints)
│   ├── script.js             # Preserved frontend logic + dynamic DB products & order integration
│   ├── profile.js            # Profile page state controller
│   └── table-order.js        # Table QR order routing & live WebSocket order tracker
│
├── backend/
│   ├── server.js             # Express app, static serving, Socket.IO setup, error handling
│   ├── config/
│   │   └── db.js             # Mongoose connection with automatic in-memory fallback
│   ├── models/
│   │   ├── User.js           # User schema with hashed passwords, addresses, favourites, preferences
│   │   ├── Product.js        # Products with sizes, stock requirements, custom options
│   │   ├── Category.js       # Beverage categories with display ordering
│   │   ├── Order.js          # Order lifecycle (PLACED, CONFIRMED, PREPARING, READY, COMPLETED)
│   │   ├── Review.js         # Customer reviews with approval flags
│   │   ├── Inventory.js      # Raw ingredients, units, minimum stock thresholds
│   │   ├── Coupon.js         # Promo codes (PERCENTAGE, FLAT, limits, expiry)
│   │   ├── Table.js          # Café dine-in tables for QR ordering
│   │   └── LoyaltyTransaction.js # Immutable loyalty beans ledger
│   │
│   ├── routes/               # Modular Express API routers
│   ├── controllers/          # Business logic & database operations
│   ├── middleware/           # auth, adminAuth, errorHandler, rateLimiter
│   ├── services/             # socket.service, razorpay.service, cloudinary.service
│   └── utils/
│       ├── calculateOrder.js # Server-side pricing enforcement & coupon validation
│       └── seed.js           # Complete database seed script
│
├── style/
│   ├── style.css             # Main artisan café styles, glassmorphism, VIP pass, cards
│   └── responsive.css        # Multi-device media queries
└── asset/                    # Café branding, coffee cup PNGs, favicon
```

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: (Optional) MongoDB Atlas or local MongoDB daemon. *Note: If a MongoDB daemon is not detected or IP is not whitelisted, Drinko automatically launches a local In-Memory MongoDB instance so the app runs out-of-the-box!*

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create or verify `.env` in the project root:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/drinko
JWT_SECRET=drinko_artisan_secret_jwt_key_92815_safe
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5000

# Optional integrations (falls back to Dev Mock modes automatically)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### 4. Seed Database
Seed initial categories, handcrafted products, inventory ingredients, coupons, tables, and accounts:
```bash
npm run seed
```

### 5. Start Application
```bash
# Production start
npm start

# Development mode with nodemon
npm run dev
```

Visit the application:
- **Customer Storefront**: [http://localhost:5000](http://localhost:5000)
- **Menu Catalog**: [http://localhost:5000/menu](http://localhost:5000/menu)
- **Customer Profile**: [http://localhost:5000/profile](http://localhost:5000/profile)
- **Table QR Ordering**: [http://localhost:5000/order?table=07](http://localhost:5000/order?table=07)
- **Admin & Kitchen KDS**: [http://localhost:5000/admin](http://localhost:5000/admin)

---

## 🔐 Default Seed Credentials

| Role | Email | Password | Access |
|---|---|---|---|
| **Administrator** | `admin@drinko.com` | `adminpassword123` | Full Admin Dashboard, KPIs, Menu, Inventory, Coupons, Reviews |
| **Kitchen Staff** | `kitchen@drinko.com` | `staffpassword123` | Kitchen Display System (KDS), Order status management |
| **Sample Customer** | `sophia@example.com` | `customerpassword123` | Storefront, Profile, Addresses, Order History, Loyalty Rewards |

---

## 📋 Complete REST API Documentation

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new customer account | Public |
| `POST` | `/api/auth/login` | Sign in with email and password | Public |
| `POST` | `/api/auth/logout` | Invalidate current user session | Public |
| `GET` | `/api/auth/me` | Fetch currently authenticated user | Private (JWT) |

### Customer Profile (`/api/profile`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/profile` | Get authenticated user's complete profile | Customer |
| `PUT` | `/api/profile` | Update personal information (name, phone, bio) | Customer |
| `PUT` | `/api/profile/password` | Change account password (requires old password) | Customer |
| `POST` | `/api/profile/avatar` | Upload customer avatar (Cloudinary or local) | Customer |
| `DELETE` | `/api/profile/avatar` | Remove customer avatar | Customer |
| `GET` | `/api/profile/addresses` | List saved delivery addresses | Customer |
| `POST` | `/api/profile/addresses` | Add a new delivery address | Customer |
| `PUT` | `/api/profile/addresses/:id` | Edit an existing address | Customer |
| `DELETE` | `/api/profile/addresses/:id` | Remove an address | Customer |
| `PUT` | `/api/profile/addresses/:id/default`| Set address as default | Customer |
| `GET` | `/api/profile/favourites` | List favorited drinks | Customer |
| `POST` | `/api/profile/favourites/:id`| Add drink to favourites | Customer |
| `DELETE` | `/api/profile/favourites/:id`| Remove drink from favourites | Customer |
| `GET` | `/api/profile/loyalty` | Get loyalty beans balance & transaction ledger | Customer |
| `PUT` | `/api/profile/preferences` | Save brewing defaults (milk, sweetness, size) | Customer |
| `PUT` | `/api/profile/notifications` | Update notification preferences | Customer |
| `POST` | `/api/profile/logout-all` | Sign out all other sessions | Customer |
| `DELETE` | `/api/profile/account` | Delete customer account (requires password) | Customer |

### Products & Categories (`/api/products`, `/api/categories`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/products` | Retrieve all available menu items | Public |
| `GET` | `/api/products/:id` | Get details of a single beverage | Public |
| `GET` | `/api/products/category/:category` | Filter drinks by category | Public |
| `POST` | `/api/products` | Create a new drink in catalog | Admin |
| `PUT` | `/api/products/:id` | Update product details / toggle availability | Admin |
| `DELETE` | `/api/products/:id` | Remove a product from catalog | Admin |
| `GET` | `/api/categories` | Retrieve all beverage categories | Public |

### Orders & Checkout (`/api/orders`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/orders` | Create an order with server-side pricing | Public / Customer |
| `GET` | `/api/orders/my-orders` | Fetch customer's past orders | Customer |
| `GET` | `/api/orders/:id` | Retrieve order status and breakdown | Customer / Admin |
| `PUT` | `/api/orders/:id/cancel` | Cancel an order in `PLACED` status | Customer |
| `POST` | `/api/orders/:id/reorder` | Recalculate and duplicate previous order | Customer |

### Real-Time Kitchen & Admin Operations (`/api/admin`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/admin/overview` | KPI overview (Revenue, Orders, Low Stock) | Admin / Staff |
| `GET` | `/api/admin/kitchen` | Live active orders in production | Admin / Staff |
| `GET` | `/api/admin/orders` | Filterable, searchable table of all orders | Admin / Staff |
| `PUT` | `/api/admin/orders/:id/status` | Advance order status (`PLACED`→`COMPLETED`) | Admin / Staff |
| `GET` | `/api/admin/customers` | Customer analytics and members list | Admin |
| `GET` | `/api/inventory` | Live ingredient stock levels and unit costs | Admin / Staff |
| `PUT` | `/api/inventory/:id` | Restock ingredient / update threshold | Admin |
| `GET` | `/api/coupons/admin` | Retrieve all promotional coupons | Admin |
| `POST` | `/api/coupons/admin` | Create new promo code | Admin |
| `POST` | `/api/coupons/validate` | Validate coupon code against subtotal | Public |
| `GET` | `/api/tables` | List café dine-in tables & QR state | Admin / Staff |

---

## ⚡ Real-Time System (Socket.IO)

Drinko features bidirectional WebSocket communication:
- **Room `kitchen_channel`**: Instantly delivers newly placed orders with full drink customizations and table references to the Kitchen Display System (with an audible chime).
- **Room `order_<orderId>`**: Pushes live status transitions (`PLACED` → `CONFIRMED` → `PREPARING` → `READY` → `COMPLETED`) directly to the customer's phone or table tracking card without page refresh.
- **Room `admin_channel`**: Emits low-stock warnings when inventory items drop below their defined minimum thresholds.

---

## 🛡️ Security Implementation
- **Zero Client Price Trust**: Client-side item prices, subtotals, and taxes are strictly ignored. The backend retrieves the authoritative price from MongoDB, multiplies for selected sizes, tallies add-on toppings, validates promo limits, computes tax, and creates the order.
- **Password Security**: Passwords are encrypted with `bcryptjs` (salt factor 10) and omitted from all API responses via `select: false`.
- **JWT Authorization**: HTTP Bearer token validation with role-based checks for `customer`, `staff`, and `admin`.
- **Header & Injection Protection**: Powered by `helmet`, `cors`, and `express-mongo-sanitize` to strip `$` and `.` operators.
- **Rate Limiting**: Configured with `express-rate-limit` (200 requests per 15 minutes per IP).

---

## 🧪 Verification & Automated Testing

The complete test suite can be run at any time:
```bash
node test_full_suite.js
```
**Test Results**:
- Customer Registration & JWT Token: **PASSED (201)**
- Admin Authentication & Role Verification: **PASSED (200)**
- Dynamic Database Products Retrieval: **PASSED (200)**
- Saved Address Management: **PASSED (201)**
- Server-Side Promo Code Validation: **PASSED (200)**
- Secure Order Calculation & Stock Deduction: **PASSED (201)**
- Kitchen Status Progression (`PLACED` → `PREPARING`): **PASSED (200)**
- Loyalty Beans Calculation & Transaction Ledger: **PASSED (200)**
- Customer Reviews Submission: **PASSED (201)**
