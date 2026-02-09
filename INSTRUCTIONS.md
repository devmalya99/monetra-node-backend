# 🚀 Monetra Backend: Step-by-Step Instructions & Workflow

Welcome to the **Monetra Node.js Backend** project! This guide serves as your comprehensive reference for setup, development, and deployment.

---

## 🛠️ Step 1: Project Setup & Installation

Before diving into code, ensure your environment is ready.

### 1.1 Prerequisites
- **Node.js** (v18+)
- **MySQL Database** (Hosted on Aiven or local)
- **Git**

### 1.2 Installation
Run the following command to install all project dependencies:
```bash
npm install
```

### 1.3 Environment Configuration
Create a `.env` file in the root directory by copying the example below:
```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE?ssl-mode=REQUIRED"
JWT_SECRET="your-super-strong-secret-key"
PORT=3000
NODE_ENV="development"
```
> **Note**: Replace the placeholders with your actual database credentials.

---

## 💾 Step 2: Database Management (Drizzle ORM)

We use **Drizzle ORM** for type-safe database interactions. Follow these steps to manage your schema.

### 2.1 Sync Schema with Database (Push)
For rapid prototyping, push your schema changes directly to the database:
```bash
npm run db:push
```
> **What this does**: It reads your schema definition in `src/schema/*` and applies changes to the connected MySQL database.

### 2.2 Generate Migrations
For production-ready changes, create migration files:
```bash
npm run db:generate
```
Apply migrations:
```bash
npm run db:migrate
```

---

## 🚀 Step 3: Running the Application

### 3.1 Development Mode (Hot Reload)
Start the server with `tsx watch` for instant feedback on code changes:
```bash
npm run dev
```
> **Output**: Look for the beautiful startup banner in your terminal!
> Access API Docs: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

### 3.2 Production Build
Compile TypeScript to JavaScript for optimal performance:
```bash
npm run build
npm start
```

---

## 📚 Tech Stack Overview

| Compmonent | Technology | Description |
| :--- | :--- | :--- |
| **Runtime** | Node.js | JavaScript runtime built on Chrome's V8 engine |
| **Framework** | Express.js | Fast, unopinionated, minimalist web framework |
| **Language** | TypeScript | Typed superset of JavaScript for scale |
| **Database** | MySQL (Aiven) | Open-source relational database management system |
| **ORM** | Drizzle | TypeScript ORM for SQL databases |
| **Auth** | JWT + Cookies | Stateless authentication with HttpOnly cookies |
| **Validation** | Zod + OpenApi | TypeScript-first schema declaration & API Docs |
| **Docs** | Swagger UI | Auto-generated from Zod schemas |

---

## 🐛 Troubleshooting

### Common Issues

1. **`drizzle.config.ts` not under `rootDir`**: 
   - **Fix**: We've updated `tsconfig.json` to include `src/**/*`. Ensure you're running the latest config.

2. **Database Connection Error**:
   - Check your `.env` file. ensure the `DATABASE_URL` is correct and the database is running.
   - If using Aiven, ensure SSL mode is required/configured correctly.

3. **Port In Use (EADDRINUSE)**:
   - The server is already running. Kill the process on port 3000 or change `PORT` in `.env`.

---

## 📝 Workflow Checklist

- [ ] **Plan**: Define new feature requirements.
- [ ] **Schema**: Update `src/schema` if database changes are needed.
- [ ] **Push DB**: `npm run db:push` to apply schema changes.
- [ ] **Code**: Implement Controllers, Services, and Routes.
- [ ] **Test**: Use Swagger UI or Postman to verify endpoints.
- [ ] **Commit**: Push changes with meaningful commit messages.

*Happy Coding! 🚀*
