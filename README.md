# LiftLog

A simple, mobile-first workout tracker. Create an account, log workouts set by set, save exercises, and watch your lifts improve over time.

**Stack:** Next.js 16 (App Router, server actions) · Supabase (Auth + Postgres with row-level security) · Tailwind CSS · deployed on Vercel.

## Features

- Email/password accounts (Supabase Auth)
- Workouts with a date and notes
- Sets with weight (lb) and reps; the form prefills from your last set so repeating one is a single tap
- Exercises are saved automatically the first time you type a new name, or added on the Exercises tab
- Progress per exercise: heaviest set, best estimated 1RM (Epley), a chart over time, and a per-session table

## Local development

```bash
cp .env.example .env.local   # fill in your Supabase URL and publishable key
npm install
npm run dev
```

The database schema is in `supabase/migrations/0001_init.sql`. Every table has row-level security so users can only see and change their own data.

## Tests

```bash
npm run typecheck && npm run lint
npm test                                # unit tests (progress math)
E2E_PASSWORD=... npm test               # + row-level-security tests against Supabase
E2E_PASSWORD=... npm run test:e2e       # Playwright, phone-sized browser, against a production build
```

The integration and end-to-end tests sign in as the pre-confirmed test users `e2e-a@liftlog.test` and `e2e-b@liftlog.test` and clean up the data they create. Set `E2E_BASE_URL` to run the Playwright suite against a deployed URL instead of a local build.

## Deployment

Vercel builds the app from GitHub. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the Vercel project, and add the deployed URL to Supabase **Authentication → URL Configuration** (Site URL and Redirect URLs `https://<your-domain>/auth/callback`) so email-confirmation links land on the app.
