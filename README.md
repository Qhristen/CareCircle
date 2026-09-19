## CareCircle

### When something happens to one person, a community can come together to help.

CareCircle is a community-powered support platform that helps people quickly
organize, contribute, and coordinate assistance for someone affected by a
traumatic event or unexpected emergency. It creates a structured, transparent
space where an organizer can list needs, invite a community, collect support,
track fulfillment, and confirm delivery.

## Why CareCircle

- Reduces fragmented coordination across chats, transfers, and spreadsheets.
- Connects contributions directly to identified needs (food, transport, shelter, etc.).
- Enables visibility, verification, and accountable fulfillment for contributors.

## How CareCircle works (summary)

1. Organizer creates a support circle describing needs and privacy settings.
2. Organizer defines specific needs (items or financial targets) and a total goal.
3. Organizer shares a private or public link to invite contributors.
4. Contributors fund the overall goal or specific needs, send items, or offer services.
5. Organizer tracks progress, posts updates, and marks needs fulfilled.
6. Recipient or an authorized representative can confirm receipt to close the loop.

## Project structure

| Directory          | Description                                                         |
| ------------------ | ------------------------------------------------------------------- |
| [`webapp`](webapp) | Next.js web client used by organizers, contributors, and recipients |
| [`api`](api)       | NestJS REST and Socket.IO API backed by PostgreSQL                  |

This repository contains a full proof-of-concept for emergency and recovery
support circles. The API supports payments, verification, activity auditing,
and real-time events. The web app is the public and organizer-facing client.

## Run locally

### Prerequisites

- Node.js 20.19 or newer
- npm 10 or newer
- Yarn 1.22
- PostgreSQL with an empty `CareCircle` database

Start each service in a separate terminal. The examples below run the API on
port `9000` and the web app on port `3000`.

### 1. Start the API

From the repository root:

```bash
cd api
cp .env.example .env
npm ci
```

Update `api/.env` with your local configuration. Example minimum setup:

```dotenv
NODE_ENV=development
PORT=9000
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:9000
CORS_ORIGINS=http://localhost:3000

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/CareCircle

JWT_SECRET=replace-with-at-least-32-random-characters
JWT_ACCESS_TOKEN_EXPIRY=900
JWT_REFRESH_TOKEN_EXPIRY=604800
```

Apply database migrations and start the development server:

```bash
npm run migration:run
npm run start:dev
```

The API will be available at http://localhost:9000/api/v1 with Swagger at
http://localhost:9000/api/v1/docs.

### 2. Start the web app

In a second terminal:

```bash
cd webapp
yarn install --frozen-lockfile
```

Create `webapp/.env.local` with:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:9000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional integrations
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```

Start the web development server:

```bash
yarn dev
```

Open http://localhost:3000 in your browser.

## Build and validate

Run API checks from `api/`:

```bash
npm run build
npm test
npm run test:e2e
npm run lint
```

Run web checks from `webapp/`:

```bash
yarn lint
yarn build
```

For production, build each service first, then use `npm run start:prod` in
`api/` and `yarn start` in `webapp/`.
