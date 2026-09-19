# CareCircle API

CareCircle turns fragmented community support into a structured, transparent
collective-support experience. This NestJS API supports the complete POC
journey: account creation, circle setup, needs lists, private invitations,
contributions, payments, social updates, fulfillment tracking, and recipient
confirmation.

## Core API

All routes use the `/api/v1` prefix. Interactive Swagger documentation is available at `/api/v1/docs`.

| Area                  | Main endpoints                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| Authentication        | `POST /auth/register`, `/auth/login`, `/auth/google`, `/auth/refresh`, `/auth/logout`                |
| Profile               | `GET/PATCH/DELETE /users/me`                                                                         |
| Circles               | `POST /circles`, `GET /circles/mine`, `GET /circles/discover`, `GET /circles/public/:slug`           |
| Circle management     | `PATCH/DELETE /circles/:id`, `POST /circles/:id/publish`, `/cancel`                                  |
| Gift items            | `POST /circles/:id/items`, `PATCH/DELETE /circles/:id/items/:itemId`                                 |
| Invitations           | `POST/GET /circles/:id/invitations`, `GET /invitations/:code`, `POST /invitations/:code/accept`      |
| Contributions         | `POST /circles/:id/contributions`, `GET /contributions/:reference/verify`, `GET /contributions/mine` |
| Payments              | `POST /webhooks/paystack`                                                                            |
| Payment configuration | `GET /payments/providers`                                                                            |
| Categories            | `GET /categories`; admin `POST/PATCH/DELETE /categories`                                             |
| Social updates        | `POST /circles/:id/updates`, `PATCH/DELETE /circles/:id/updates/:updateId`                           |
| Organizer dashboard   | `GET /circles/:id/dashboard`                                                                         |
| Fulfillment           | `PATCH /circles/:id/fulfillment`, `POST /circles/:id/recipient-confirmation-link`                    |
| Recipient             | `POST /circles/:id/confirm-receipt`                                                                  |
| Notifications         | `GET /notifications`, `PATCH /notifications/:id/read`, `/notifications/read-all`                     |
| Moderation            | `POST /moderation/reports`; admin review, suspend, hide, and restore routes                          |

## Client contract routes

The current web client contract is available alongside the legacy aliases above. Monetary values on these routes are integer kobo values.

| Area               | Endpoints                                                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Explore and detail | `GET /circles`, `GET /circles/:slug`                                                                                                   |
| Draft workflow     | `POST /circles`, `PATCH /circles/:id` with `If-Match`, `POST /circles/:id/publish`                                                     |
| Contributions      | `POST /circles/:id/contribution-intents`, `GET /contributions/:id`, `GET /circles/:id/contributions`, `GET /contributions/:id/receipt` |
| Contact            | `POST /circles/:id/messages`                                                                                                           |
| Organizer          | `/organizer/circles/:id/dashboard`, contributions, wishlist items, settings, broadcasts, purchase orders, and delivery address routes  |
| Invite-only        | `POST /organizer/circles/:id/invitations`, `POST /circle-invitations/accept`                                                           |
| Supporting         | `POST /writing/polish`, `GET /catalog/items`                                                                                           |

Contribution and publish initialization accepts `Idempotency-Key`. Draft autosave uses an `If-Match` version and returns `409 VERSION_CONFLICT` for stale writes. Public discovery includes only `public` circles; anonymous wall entries redact both identity and amount.

Circle and wishlist requests do not use categories. The standalone category module remains available for existing data and independent administration. Gift items do not carry images. Other image fields such as `coverImageUrl`, circle-update `imageUrl`, `avatarUrl`, `iconUrl`, and `proofUrl` accept client-uploaded string references; the API does not upload or derive asset URLs.

Private circles require an invitation. Link-only circles can be opened by anyone with their unlisted URL. Community circles appear in discovery. Contribution responses and public circle pages respect each contributor's name, amount, and message visibility settings.

Real-time events are available from the Socket.IO `/circles` namespace. Authenticate with `handshake.auth.token`, then emit `circle:join` with a `circleId` and optional private-circle `invitationCode`. Clients receive `circle:updated`, `contribution:received`, `fulfillment:updated`, and `notification:new` events.

## Local setup

Node.js 20.19 or newer is required.

```bash
cp .env.example .env
npm install
npm run migration:run
npm run start:dev
```

The API defaults to `http://localhost:9000/api/v1`. Configure a payment provider secret key to initialize and verify real contributions. Set the webhook URL to `https://your-api.example/api/v1/webhooks/payments`.

## Validation

```bash
npm run build
npm test
npm run test:e2e
npm run lint
```

The PostgreSQL schema is managed by the migrations in [`src/database/migrations`](src/database/migrations).
