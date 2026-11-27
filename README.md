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

### Automated staging deployment

Every successful push to `develop` publishes an immutable
`develop-<commit-sha>` image and then deploys that exact image to staging. The
deployment connects to the private staging network through OpenVPN, uses a
verified SSH host key, and performs both container-local and external smoke
checks. A failed deployment restores the previous Compose and environment
state automatically.

Create a GitHub Environment named `staging` with these variables:

- `STAGING_HOST` — VPN/private SSH address of the staging server
- `STAGING_USER` — restricted SSH deployment user
- `STAGING_DEPLOY_DIR` — absolute server directory containing the deployment
- `STAGING_URL` — URL reachable from the VPN-connected Actions runner
- `STAGING_AUTO_DEPLOY_ENABLED` — set to `false` while validating connectivity,
  then change to `true` to enable automatic deployment after `develop` pushes

Add these Environment secrets:

- `STAGING_OVPN_CONFIG_B64` — base64-encoded, self-contained OpenVPN profile
- `STAGING_SSH_PRIVATE_KEY` — private key for the restricted deployment user
- `STAGING_SSH_KNOWN_HOSTS` — verified SSH `known_hosts` entry for the server
- `STAGING_VPN_USERNAME` and `STAGING_VPN_PASSWORD` — only when the OpenVPN
  profile contains `auth-user-pass`
- `STAGING_VPN_KEY_PASSPHRASE` — only when the VPN client key requires one

The staging server must already have Docker and Compose, a read-only GHCR
login, the external `staging-app` Docker network, and an ignored `.env` file
based on `deploy/staging.env.example`. Do not store VPN profiles, SSH private
keys, package tokens, or the server `.env` file in the repository.

For the initial rollout, keep `STAGING_AUTO_DEPLOY_ENABLED=false`, merge the
workflow, and manually run **Build and publish develop image** with
`staging_action=connectivity` on `develop`. This trusted, read-only check opens
the VPN and verifies SSH without changing the server. After it succeeds, set
the variable to `true` and run `staging_action=deploy` once to deploy the
current `develop` image. Future pushes then deploy automatically.

During the initial VPN/SSH troubleshooting only, the
`fix/staging-vpn-ssh-timeout` pull request also runs the same read-only staging
connectivity check. This temporary exception exposes staging Environment
secrets to workflow code controlled by that PR, so the Environment must require
a reviewer and the exception must be removed after the check succeeds and
before the PR is merged.

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
