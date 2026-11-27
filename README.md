# Tahe Dig Frontend

React + TypeScript + Vite + Tailwind CSS v4.

## Getting started

    npm install
    copy .env.example .env
    npm run dev

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run format` — Prettier

## Containers

Build and run the frontend locally:

    docker compose up --build

The container listens on <http://localhost:8080>. It proxies `/api/*` to
`BACKEND_UPSTREAM` after removing the `/api` prefix. Local Compose defaults to
`http://host.docker.internal:8080`, which matches the Go API's exposed port.

Container endpoints:

- `/healthz` — lightweight container health check
- `/version.json` — deployed version and commit metadata

For staging, copy `deploy/staging.env.example` to the ignored
`deploy/staging.env`, replace the placeholder with an immutable commit-tagged
image, and deploy it:

    docker compose --env-file deploy/staging.env -f deploy/compose.staging.yaml up -d

If the API is a service on the same Docker network, set `BACKEND_UPSTREAM` to
its service URL, for example `http://api:8080`.

## Folder structure

- `src/app` — router, App root
- `src/config` — env config
- `src/layouts` — Public / Vendor / Admin layouts
- `src/pages` — route pages
- `src/features` — feature modules (auth, offers, orders, ...)
- `src/components/ui` — design-system components
- `src/lib` — API client, helpers
- `src/hooks`, `src/types`

## Authentication API placeholders

The login and account-recovery screens are implemented under `src/features/auth`.
Set `VITE_API_BASE_URL` in `.env`, then adapt the endpoint paths and response types
in `src/features/auth/api/authApi.ts` when the backend is ready:

- `POST /auth/login`
- `POST /auth/recovery/otp`
- `POST /auth/recovery/otp/verify`

## Vendor dashboard API integration

The implemented vendor pages use service modules under `src/services/vendor/`:

- `productsService.ts` — product listing, detail, create/edit, remove, and unpublish operations
- `ordersService.ts` — vendor order listing
- `reservationsService.ts` — vendor reservation listing

The supplied Go API list is now used by `ordersService.ts` and `reservationsService.ts`: both load the authenticated vendor's orders from `GET /orders`, including cursor pagination. The current contract has no separate reservation endpoint or delivery-confirmation action, so the reservation view is read-only. `productsService.ts` remains a clearly marked local demo adapter because the supplied list does not include vendor product CRUD or image-upload endpoints; the public store-offers endpoint does not provide enough data or operations for product create/edit. New integrations use `apiRequest` in `src/lib/api/client.ts`, which reads `VITE_API_BASE_URL` and the stored access token.

## Design system

Tokens are defined in `src/index.css` (`@theme`) following the approved Figma
design system: colors, Vazirmatn typography, 4px spacing grid, radius, shadows.
RTL is enabled globally (`<html lang="fa" dir="rtl">`).
