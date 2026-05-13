# Project Context

## Overview
E-commerce site with Admin and Customer roles.

## Tech Stack
- **Frontend:** React (Vite) + Tailwind CSS
- **Backend:** Node.js (Express)
- **Database:** PostgreSQL 16
- **Storage:** Cloudinary
- **Deployment:** Docker & Docker Compose

## Key Features
- **Unique 8-char alphanumeric codes** for every product
- **Admin Capabilities:** Can suspend users and products
- **Customer Capabilities:** Can pay directly

## Project Rules
1. Maintain clear separation between Admin and Customer functionality
2. All products must have unique 8-character alphanumeric identifiers
3. Suspension logic must be enforced at the database and API levels
4. Direct payment processing must be secure and validated
5. Use environment variables for sensitive configuration (JWT_SECRET, CLOUDINARY_URL, DB_URL)
6. Follow RESTful API conventions for backend endpoints
7. Use Docker for consistent development and production environments
