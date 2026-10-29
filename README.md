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

## Authentication API placeholders

The login and account-recovery screens are implemented under `src/features/auth`.
Set `VITE_API_BASE_URL` in `.env`, then adapt the endpoint paths and response types
in `src/features/auth/api/authApi.ts` when the backend is ready:

- `POST /auth/login`
- `POST /auth/recovery/otp`
- `POST /auth/recovery/otp/verify`

## Design system

Tokens are defined in `src/index.css` (`@theme`) following the approved Figma
design system: colors, Vazirmatn typography, 4px spacing grid, radius, shadows.
RTL is enabled globally (`<html lang="fa" dir="rtl">`).
