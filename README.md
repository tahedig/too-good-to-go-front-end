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

## Folder structure

- `src/app` — router, App root
- `src/config` — env config
- `src/layouts` — Public / Vendor / Admin layouts
- `src/pages` — route pages
- `src/features` — feature modules (auth, offers, orders, ...)
- `src/components/ui` — design-system components
- `src/lib` — API client, helpers
- `src/hooks`, `src/types`

## Backend API

Set `VITE_API_BASE_URL=/api` in `.env`. Vite proxies `/api/*` to
`http://localhost:8080/*` during development. The production Nginx config proxies
the same prefix to the backend service at `api:8080`; frontend and backend
containers must share a Docker network.

Customer OTP login calls `POST /auth/otp/request` and `POST /auth/otp/verify`.
The verified bearer token is stored and attached by the shared API client.
Account-recovery screens still use the separate placeholder routes in
`src/features/auth/api/authApi.ts`.

## Vendor dashboard API integration

The implemented vendor pages use service modules under `src/services/vendor/`:

- `productsService.ts` — product listing, detail, create/edit, remove, and unpublish operations
- `ordersService.ts` — vendor order listing
- `reservationsService.ts` — vendor reservation listing

The supplied Go API list is now used by `ordersService.ts` and `reservationsService.ts`: both load the authenticated vendor's orders from `GET /orders`, including cursor pagination. The current contract has no separate reservation endpoint or delivery-confirmation action, so the reservation view is read-only. `productsService.ts` remains a clearly marked local demo adapter because the supplied list does not include vendor product CRUD or image-upload endpoints; the public store-offers endpoint does not provide enough data or operations for product create/edit. New integrations use `apiRequest` in `src/lib/api/client.ts`, which reads `VITE_API_BASE_URL` and the stored access token.

## Customer product details

The home feed loads `/home/today`, `/home/popular-nearby`, and
`/home/last-chance`. Selecting a live offer opens `/products/:productId`, which
loads its details from `GET /offers/:id`. Known bakery sample IDs remain
available when the API is offline; the home page explicitly labels sample data
when it falls back.

## Customer checkout

The `/checkout` page reloads the offer to check its current stock and pickup
details, then creates the reservation with `POST /reservations`, the accepted
pickup terms, and an `Idempotency-Key`. The endpoint requires customer login.
The backend calculates the service fee and final amount, so the exact total is
shown after the reservation response.

## Reservation confirmation

The `/reservations/:reservationId/confirmation` page displays the reservation
response passed through router state, including its reference, pickup code,
status, and final amount. The current backend exposes no
`GET /reservations/:id`; opening the confirmation URL without that state cannot
reload the reservation.

## Design system

Tokens are defined in `src/index.css` (`@theme`) following the approved Figma
design system: colors, Vazirmatn typography, 4px spacing grid, radius, shadows.
RTL is enabled globally (`<html lang="fa" dir="rtl">`).
