# 🚀 Project Accomplishments & Features

This document outlines the key technical achievements, architectural decisions, and features implemented in the **Monetra Backend**. It serves as a reference for future development and showcases the engineering quality of the project.

## 🏗️ Core Architecture & Design
- **Modular Layered Architecture**: Code is organized into `controllers`, `services`, `routes`, `middlewares`, and `models` resulting in a highly maintainable and scalable codebase.
- **TypeScript Integration**: Full type safety across the entire backend, reducing runtime errors and improving developer productivity with IntelliSense.
- **Express.js Framework**: Robust and flexible web server foundation.
- **Custom Error Handling**: Centralized error handling middleware that captures and formats errors consistently across the application.
- **Graceful Shutdown**: Implementation of process signal handling (`SIGTERM`, `SIGINT`) to ensure the server closes strict connections and saves state before exiting.

## 💾 Database & ORM
- **MySQL (Aiven Hosted)**: Reliable and scalable relational database service.
- **Drizzle ORM**: Modern, lightweight, and type-safe ORM for SQL databases.
  - **Schema Definition**: Declarative schema definition in TypeScript.
  - **Migrations**: Automated migration generation and execution using `drizzle-kit`.
  - **Type Inference**: Automatic type inference for database queries, eliminating the need for manual interface definitions.
- **UUID Primary Keys**: Switched from sequential integers to random UUIDs for secure and unpredictable user IDs.
- **Connection Pooling**: Efficient database connection management for high concurrency.
- **ACID Transactions System-wide**: `db.transaction()` wrapper implemented unconditionally for all mutating operations (e.g., Signup, Add Expense, Premium Payment resolution), preventing partial data failures across both single and multi-query requests.

## 🔐 Security & Authentication
- **JWT Authentication**: Secure stateless authentication using JSON Web Tokens.
- **HttpOnly Cookies**: Tokens are stored in HttpOnly cookies to prevent XSS attacks.
- **Password Hashing**: User passwords are securely hashed using `bcryptjs` before storage.
- **Input Validation**: Comprehensive request validation using **Zod v4** schemas to ensure data integrity and prevent injection attacks.
- **Environment Configuration**: Sensitive data (API keys, DB URLs) managed via `.env` files, strictly excluded from version control.
- **CORS & Helmet**: Security headers and Cross-Origin Resource Sharing configuration to protect the API.

## 🛠️ Developer Experience (DX)
- **Automated API Documentation**: Switched from manual JSDoc to `zod-to-openapi` for automated, Type-Safe Swagger UI generation covering Key Auth & Expense flows.
- **Structured Logging**: Custom logger with colorful output for better debuggability and monitoring.
- **Hot Reloading**: `tsx watch` for instant feedback during development.
- **Clean Code Practices**: usage of `prettier` and `eslint` for consistent code style.

## 🚀 API Functionality
- **User Management**:
  - **Sign Up**: Secure user registration with validation.
  - **Sign In**: User login with secure cookie setting.
  - **Profile Management**: Extensible user profile structure.
  - **Session Persistence**: `/user/me` endpoint to hydrate frontend state on reload.
  - **Secure Logout**: `/user/logout` to clear HttpOnly cookies.
  - **Advanced Session-Based Password Recovery**: Engineered a professional, dual-phase password reset ecosystem utilizing the **Brevo (formerly Sendinblue) SDK**.
    - **One-Time Use**: Implemented strict state management via the `forgot_password_requests` table, deactivating links immediately after successful use.
    - **Timed Expiration**: Integrated a strict 15-minute security window for all reset sessions.
    - **Backend-First Verification**: Developed a `GET` handshake that validates the link and redirects to the frontend, ensuring users only see the reset form if their session is valid.
    - **Credential Security**: Final password updates are secured via a protected `POST` submission with atomic database updates.
- **Health Checks**: `/test` endpoint for uptime monitoring.
- **Expense Management**:
  - **Add Expense**: `/user/add-expense` endpoint to securely add user expenses.
  - **Update Balance**: `/user/update-balance` to set or update the monthly allocated balance.
  - **Get Monthly Balance**: `/user/monthly-balance` to retrieve just the current monthly allocated balance.
  - **Get Top Categories**: `/user/top-categories` to fetch top spending categories grouped dynamically with database aggregations.
  - **Search Expenses**: `/user/search-expenses` to search expenses flexibly by name, title, or category.
  - **Get Expenses**: `/user/my-expenses` to retrieve all expenses for the authenticated user (date sorted) along with total, allocated, and remaining balances. Optimized for frontend client-side pagination with dynamic persistence.
  - **Delete Expense**: `/user/delete-expense/:id` with ownership verification and strict transaction-based database safety.
- **Premium Memberships**:
  - **Auto-Seeding**: Automatically seeds premium membership tiers (Pro, Ultra, Max) on server load.
  - **Dynamic Tier Verification**: Securely verifies incoming frontend requests matching database membership IDs.
  - **Payment Gateway (Razorpay/Cashfree)**: Architected a robust, end-to-end payment ecosystem with cryptographic signature verification and automated webhooks.
  - **Transaction State Management**: Designed a resilient dual-table system using `orders` and `premium_membership_data` to guarantee zero discrepancies and eliminate payment race conditions.

---
*This file is automatically updated to reflect the latest features and accomplishments of the Monetra Backend project.*
