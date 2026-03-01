# Monetra Backend Service 🚀

![Node.js](https://img.shields.io/badge/Node.js-18.x-green) ![Express](https://img.shields.io/badge/Express-5.x-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue) ![MySQL](https://img.shields.io/badge/MySQL-8.0-orange) ![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-v0.30+-purple)

Welcome to the **Monetra Backend**, a robust and strictly typed Node.js application built with performance and maintainability in mind.

## 📚 Documentation

- **[📖 Step-by-Step Instructions](./INSTRUCTIONS.md)**: Detailed setup and development workflow.
- **[🏆 Project Accomplishments](./ACCOMPLISHMENTS.md)**: Key features and technical highlights.
- **[🔥 API Documentation](http://localhost:9100/api-docs)**: Interactive Swagger UI.

Backend service for the Monetra Expense Tracker application, built with Node.js, Express, and MySQL (via Drizzle ORM).

## Architecture

This project follows a modular, layered architecture to ensure scalability and maintainability.

### Folder Structure

```
src/
├── config/         # Configuration files (Swagger, env vars validation)
├── controllers/    # Request handlers (business logic entry points)
├── db/             # Database connection and client setup
├── middlewares/    # Custom Express middlewares (error handling, auth)
├── routes/         # API route definitions
├── schema/         # Drizzle ORM schemas and Zod validations
├── services/       # Business logic (optional layer for complex operations)
├── utils/          # Helper functions and classes (AppError, logger)
├── app.ts          # Express app configuration
└── server.ts       # Server entry point
```

### Key Technologies

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MySQL (hosted on Aiven)
- **ORM**: Drizzle ORM (for type-safe SQL queries)
- **Validation**: Zod (v4 - uses `.issues` instead of `.errors`)
- **Email Service**: Brevo (formerly Sendinblue) with official Node SDK
- **Authentication**: JWT (JSON Web Tokens) with Cookies
- **Documentation**: Swagger UI (Automated via Zod-to-OpenAPI)
- **Logging**: Custom logger with colors

## Getting Started

### Prerequisites

- Node.js installed
- MySQL database (Aiven or local)

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure environment variables:
    Create a `.env` file in the root directory:
    ```env
    DATABASE_URL="mysql://<user>:<password>@<host>:<port>/<database>?ssl-mode=REQUIRED"
    JWT_SECRET="your-secret-key"
    PORT=9100
    NODE_ENV="development"
    ```

### Running the App

- **Development**: Starts the server with hot-reloading.
    ```bash
    npm run dev
    ```

- **Production Build**:
    ```bash
    npm run build
    npm start
    ```

- **Database Management**:
    ```bash
    npm run db:push      # Push schema changes to DB
    npm run db:generate  # Generate migration files
    npm run db:migrate   # Apply migrations
    ```

## API Documentation

The API documentation is auto-generated using `zod-to-openapi` directly from the validation schemas and route definitions.

- Access the docs at: `http://localhost:9100/api-docs`

## API Endpoints

### Auth

- `POST /user/signup`: Create a new user account.
- `POST /user/signin`: Log in an existing user.
- `GET /user/me`: Get current user details (session check).
- `POST /user/logout`: Log out user and clear cookies.
- `POST /user/request-password-reset`: Request an email with a link to reset the user's password.
- `POST /user/add-expense`: Create a new expense record (requires auth).
- `GET /user/my-expenses`: Get all expenses for the authenticated user, plus total, allocated, and remaining balance.
- `DELETE /user/delete-expense/:id`: Delete a specific expense by ID (requires auth) using ACID compliant transactions.
- `POST /user/update-balance`: Update or set the monthly allocated balance.
- `GET /user/monthly-balance`: Get the monthly allocated balance for the authenticated user.
- `GET /user/top-categories`: Get the top spending categories for the authenticated user.
- `GET /user/search-expenses`: Search expenses by name/title or category.
- `GET /user/test`: verification endpoint

### Premium Membership

- `GET /premium/memberships`: Get a list of all available premium tier memberships.
- `POST /premium/verify-order`: Verify an incoming membership order request and resolve it internally.

### General

- `GET /test`: Health check endpoint.
## Cashfree Integration
Added Cashfree API integration to create order sessions under `/premium/verify-order` and Webhook verification at `/premium/webhook`.
