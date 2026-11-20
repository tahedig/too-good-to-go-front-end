# Tahe Dig Frontend

React + TypeScript + Vite + Tailwind CSS v4.

## Getting started

```sh
npm ci
cp .env.example .env
npm run dev
```

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm test` — vendor API contracts, pickup windows, finance filters and preview flows
- `npm run format` — Prettier

## Folder structure

- `src/app` — router, App root
- `src/config` — env config
- `src/layouts` — Public / Vendor / Admin layouts
- `src/pages` — route pages
- `src/features` — feature modules (auth, vendor dashboard, etc.)
- `src/components/ui` — design-system components
- `src/lib` — API client, helpers
- `src/services` — backend integrations

## Vendor dashboard

Open `/vendor` after signing in with an OTP for a user with the `vendor` role. The
frontend sends the login token using the shared `apiRequest` client. In development,
Vite forwards `/api/*` to the Go backend (default `API_PROXY_TARGET=http://localhost:8080`),
stripping `/api` before forwarding. Set `API_PROXY_TARGET` in `.env` to use a different
backend origin. When deploying behind a reverse proxy, apply the same rewrite for
`/api/*`, or set `VITE_API_BASE_URL` at build time to the served API base. The
paths below are relative to the root of the Go API.

| Dashboard data                            | Backend contract                                                                                                            |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Store context and active products         | `GET /vendor/stores` (store context only falls back to `GET /vendor/store` from TEAM-48)                                    |
| Most recent pending store request         | `GET /vendor/store-requests`                                                                                                |
| Available packages                        | Cursor-paginated `GET /stores/:id/offers`, for the vendor's approved stores                                                 |
| Reserved packages and nearest open pickup | Paginated `GET /vendor/orders`, from [backend TEAM-48 / PR #22](https://github.com/tahedig/too-good-to-go-back-end/pull/22) |
| Confirm delivery                          | `POST /vendor/orders/:id/verify-pickup`, from the same PR                                                                   |

Deploy a backend that includes TEAM-48 to enable the reservation list and pickup
confirmation. `GET /orders` is not a fallback: it lists purchases made by the caller.

The reviewed Go `main` and TEAM-48 sources declare store-management routes but do not
wire `Store` and `StoreRequest` into `provideHandlers` in `internal/injector/injector.go`.
To enable those routes, the backend must also resolve the authenticated public user ID
from JWT middleware to the numeric ID expected by its store handlers. Without this
wiring, TEAM-48 can supply the active store via `/vendor/store` but not the active product
count or pending store requests.

Delivery is only shown as confirmed after a successful response. The frontend always
requires a four-digit pickup code; the backend must enforce valid pickup codes too.
Pickup windows from TEAM-48 are returned in UTC and displayed in Tehran time with a
Jalali calendar date.

The current API does **not** provide vendor payouts, net revenue, plans, or the original
published quantity for an offer. The dashboard leaves those values unavailable rather
than treating reservations or gross sales as received payments. Vendor product
create/edit still uses the existing local adapter until vendor product CRUD is provided
by the Go backend.

To inspect the Figma states without a backend, open `/vendor?preview=1` on the Vite dev
server. This mode is explicitly labelled, uses a design fixture, and cannot record a
pickup. Neither the fixture nor this mode is included in the production build.

## Vendor finance

The vendor menu links to four sections under `/vendor/finance`: `overview`, `plans`,
`transactions`, and `settlements`. All four routes use the vendor sidebar on desktop;
mobile section tabs navigate between routes. Transactions use cards on mobile and a
table on desktop, and status, type, and period filters are stored in the URL. The
shared `Select` uses the site tokens for white options, green selection, and beige
hover, with keyboard, pointer, and touch support.

`src/services/vendor/financeService.ts` reads active and ready-for-pickup orders for
the overview from `GET /vendor/orders` when the TEAM-48 contract is deployed. Their
amounts are shown separately from completed sales. The reviewed backend provides no
finance ledger, completed-sales report by settlement period, plan/subscription API,
bank account registration, or settlement request endpoint. Without those contracts,
live balances and histories are explicitly unavailable and financial submissions are
disabled. Customer purchases and daily gross order totals are not used as substitutes.

Open `/vendor/finance/overview?preview=1` on Vite, or set
`VITE_VENDOR_FINANCE_PREVIEW=1` to enable the labelled demo across the four routes.
`?preview=0` opts out, and the explicit opt-in/opt-out follows finance navigation.
Preview actions update a shared in-memory example within the current tab; reloading
resets it. They do not contact the server, write to browser storage, change a real
subscription, or make any payment. To try the payout validation, use a test name and
the synthetic checksum-valid number `IR490000000000000000000000`, not real details.

The demo provider is isolated in `src/features/vendor-finance/previewFinance.ts` and
`previewTransactions.ts`, with a development-only dynamic import in `FinancePage.tsx`.
They are excluded from production builds. To retire the demo, remove the preview
import and switch and plug the verified finance contracts into `vendorFinanceSource`.

Reservations and daily orders use the same Jalali picker as the product editor. History
filters allow past dates and keep `?date=YYYY-MM-DD` in Gregorian format. The product
editor continues to prevent choosing dates before today.

## Design system

Tokens are defined in `src/index.css` (`@theme`) following the approved Figma
design system: colors, Vazirmatn typography, 4px spacing grid, radius, shadows.
RTL is enabled globally (`<html lang="fa" dir="rtl">`).
