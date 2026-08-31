# graphql-nestjs

A production-oriented GraphQL API built with **NestJS**, **Apollo Server**, and **TypeORM** on **MySQL**. It implements a small e-commerce-style domain (Users, Products, Orders) on top of a reusable, hardened application skeleton: optimistic concurrency, transactional stock management, request tracing, rate limiting, query-complexity/depth protection, and unified error handling across both GraphQL and REST.

---

## Features

- **Schema-first GraphQL** — `.graphql` type definitions per module, resolved via `@nestjs/graphql` + Apollo Driver (Express).
- **Domain modules** — `User`, `Product`, `Order`, each with full CRUD, pagination, sorting, and search.
- **Order lifecycle** — a real state machine (`PENDING → CONFIRMED → SHIPPED → DELIVERED`, with `CANCELLED` branches), transactional stock decrement/restock with pessimistic row locking.
- **Optimistic concurrency control** — every entity carries a `version` column; concurrent updates fail with a `409 Conflict` instead of silently overwriting.
- **Generic base layer** — `BaseEntity` and `BaseService<T>` provide pagination, sorting, filtering, and search out of the box for any new module.
- **Unified error handling** — a single `AppException` hierarchy (`BadRequest`, `NotFound`, `Conflict`, `Validation`) formatted consistently for both GraphQL responses and REST/HTTP responses via `AllExceptionsFilter`.
- **Database error translation** — MySQL duplicate-key and foreign-key violations are automatically mapped to `409 Conflict` with a readable message (`DatabaseExceptionMapper`).
- **Request tracing** — every request gets an `x-request-id` (generated or passed through), propagated into GraphQL context and structured logs.
- **Security**
  - `helmet` HTTP headers
  - Configurable CORS, **required** to be explicitly set in production
  - Rate limiting on `/graphql` (HTTP) and a custom sliding-window limiter for WebSocket subscription connections
  - GraphQL query **depth limiting** (max depth 8) and **complexity limiting** (max 1000) to prevent abusive queries
  - Introspection and GraphiQL disabled in production
- **Realtime** — GraphQL subscriptions (`graphql-ws`) for `userCreated`, `productCreated`, `orderCreated`.
- **Custom scalar** — strict ISO-8601 `DateTime` scalar with validation on both input and output.
- **Health checks** — liveness (`/health`) and readiness (`/health/ready`, verifies DB connectivity).
- **Config validation** — all environment variables validated at boot with Joi; the app fails fast on misconfiguration.
- **Migrations** — TypeORM migrations, no `synchronize` in production.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 12 |
| API | GraphQL (Apollo Server via `@nestjs/apollo`, Express driver) |
| ORM / DB | TypeORM + MySQL 8 (`mysql2` driver) |
| Validation | `class-validator`, `class-transformer`, Joi (env) |
| Realtime | `graphql-ws`, `graphql-subscriptions` (in-memory PubSub) |
| Security | `helmet`, `express-rate-limit`, `graphql-depth-limit`, `graphql-query-complexity` |
| Testing | Jest, Supertest |
| Lint / Format | `oxlint`, Prettier |
| Container | Docker (multi-stage), Docker Compose (MySQL) |

---

## Project Structure

```
src/
├── common/                  # Cross-cutting, reusable application layer
│   ├── base/                 # BaseEntity, BaseService<T> (pagination/sort/search)
│   ├── constants/             # Pagination defaults, app constants
│   ├── decorators/            # @RequestId()
│   ├── exceptions/            # AppException hierarchy + error codes
│   ├── filters/                # AllExceptionsFilter (GraphQL + HTTP)
│   ├── interceptors/          # LoggingInterceptor
│   ├── mappers/                # DatabaseExceptionMapper (SQL error → AppException)
│   ├── middleware/            # request-id middleware
│   ├── pipes/                  # ValidationPipe (whitelist + structured errors)
│   ├── security/               # HTTP rate limiter
│   └── types/                  # ListArgs, PaginatedResult, SortOrder
├── config/                    # app/database/graphql config + env validation (Joi)
├── database/                  # TypeORM module, DataSource, migrations, TransactionService
├── graphql/                    # Apollo module setup, error formatter, custom scalar
│   ├── plugins/                # Query complexity plugin
│   └── subscriptions/           # PubSub, WS connection rate limiter
├── health/                      # Liveness / readiness controller
├── modules/
│   ├── user/                    # Entity, service, resolver, GraphQL SDL, DTOs
│   ├── product/                 # Entity, service, resolver, GraphQL SDL, DTOs
│   └── order/                   # Entity, service (stock + state machine), resolver, SDL, DTOs
└── main.ts                      # Bootstrap: helmet, CORS, filters, pipes, rate limiting
```

Each domain module follows the same shape: `entities/`, `graphql/` (resolver + `.graphql` SDL + `inputs/`), `<name>.service.ts`, `<name>.types.ts`, `<name>.module.ts`.

---

## Prerequisites

- Node.js 22+
- MySQL 8 (or Docker)
- npm

---

## Getting Started

### 1. Install dependencies

```bash
npm ci
```

### 2. Configure environment

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `NODE_ENV` | `development` \| `test` \| `production` | `development` |
| `APP_NAME` | Application name | `graphql-nestjs` |
| `APP_PORT` | HTTP port | `3000` |
| `DB_HOST` | MySQL host | — (required) |
| `DB_PORT` | MySQL port | `3306` |
| `DB_USERNAME` | MySQL user | — (required) |
| `DB_PASSWORD` | MySQL password | — (required, may be empty) |
| `DB_ROOT_PASSWORD` | MySQL root password (Docker Compose only) | — |
| `DB_NAME` | MySQL database name | — (required) |
| `DB_SYNCHRONIZE` | Auto-sync schema (dev only, ignored in production) | `false` |
| `DB_LOGGING` | Log SQL queries | `false` |
| `GRAPHQL_PATH` | GraphQL endpoint path | `/graphql` |
| `GRAPHQL_GRAPHIQL` | Enable GraphiQL UI (non-production only) | `false` |
| `CORS_ORIGINS` | Comma-separated allowed origins — **required in production** | *(empty = allow all in dev)* |
| `LOG_LEVEL` | `error` \| `warn` \| `log` \| `debug` \| `verbose` | `log` |

### 3. Start MySQL

```bash
docker compose up -d
```

### 4. Run migrations

```bash
npm run migration:run
```

### 5. Start the app

```bash
npm run start:dev
```

The API is available at `http://localhost:3000/graphql`. Health checks at `/health` and `/health/ready`.

---

## GraphQL API

### User

```graphql
type Query {
  users(page: Int, limit: Int, sortBy: UserSortField, sortOrder: SortOrder, search: String): UserConnection!
  user(id: ID!): User!
}
type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
  deleteUser(id: ID!): Boolean!
}
type Subscription {
  userCreated: User!
}
```

### Product

```graphql
type Query {
  products(page: Int, limit: Int, sortBy: ProductSortField, sortOrder: SortOrder, search: String): ProductConnection!
  product(id: ID!): Product!
}
type Mutation {
  createProduct(input: CreateProductInput!): Product!
  updateProduct(id: ID!, input: UpdateProductInput!): Product!
  deleteProduct(id: ID!): Boolean!
}
type Subscription {
  productCreated: Product!
}
```

### Order

```graphql
type Query {
  orders(page: Int, limit: Int, sortBy: OrderSortField, sortOrder: SortOrder, status: OrderStatus): OrderConnection!
  order(id: ID!): Order!
}
type Mutation {
  createOrder(input: CreateOrderInput!): Order!   # locks product stock, decrements it, fails if insufficient
  updateOrder(id: ID!, input: UpdateOrderInput!): Order!  # status transitions only; quantity is immutable
}
type Subscription {
  orderCreated(userId: ID!): Order!
}
```

**Order status transitions** (enforced server-side):

```
PENDING   → CONFIRMED, CANCELLED
CONFIRMED → SHIPPED, CANCELLED
SHIPPED   → DELIVERED
DELIVERED → (terminal)
CANCELLED → (terminal, restocks the product)
```

All list queries return a `*Connection` type: `{ items, total, page, limit, totalPages, hasNextPage, hasPreviousPage }`.

---

## Error Format

Every error — GraphQL or REST — carries a stable `code`:

`BAD_REQUEST` · `NOT_FOUND` · `CONFLICT` · `VALIDATION_ERROR` · `INTERNAL_ERROR`

GraphQL errors are returned in `extensions.code` (with `extensions.details` for validation field errors). Internal errors never leak messages or stack traces in production. REST errors (from `/health`, etc.) follow:

```json
{
  "statusCode": 503,
  "code": "SERVICE_UNAVAILABLE",
  "message": "Application is not ready",
  "requestId": "...",
  "timestamp": "...",
  "path": "/health/ready"
}
```

---

## Security & Limits

- **Depth limit**: queries deeper than 8 levels are rejected.
- **Complexity limit**: queries with estimated complexity over 1000 are rejected.
- **Rate limiting**: 100 requests/minute per client on `/graphql`; WebSocket subscription connections are capped at 20 per minute per IP.
- **CORS**: must be explicitly configured (`CORS_ORIGINS`) when `NODE_ENV=production`, or the app refuses to boot.
- **Introspection / GraphiQL**: disabled automatically outside development.
- **Batched HTTP requests**: disabled.

---

## Scripts

| Command | Description |
|---|---|
| `npm run start:dev` | Start with hot reload |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run compiled build |
| `npm test` | Unit tests |
| `npm run test:e2e` | End-to-end tests |
| `npm run test:cov` | Coverage report |
| `npm run lint` | Lint via `oxlint` |
| `npm run format` | Format via Prettier |
| `npm run migration:generate` | Generate a new migration from entity changes |
| `npm run migration:run` | Apply pending migrations |
| `npm run migration:revert` | Revert the last migration |

---

## Docker

```bash
docker compose up -d        # MySQL only
docker build -t graphql-nestjs .
docker run --env-file .env -p 3000:3000 graphql-nestjs
```

The `Dockerfile` uses a multi-stage build (compile in a `build` stage, install only production dependencies in the `runtime` stage) and runs as the non-root `node` user.

---

## License

UNLICENSED — private project.