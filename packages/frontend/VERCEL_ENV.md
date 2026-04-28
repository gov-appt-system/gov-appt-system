# Vercel Environment Variables

Configure these environment variables in the Vercel Dashboard under
**Project Settings → Environment Variables** before deploying.

## Required Variables

| Variable | Example | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `https://api.youragency.gov.ph` | Backend API base URL (no trailing slash). Used by Axios and the `/api` rewrite rule. |
| `VITE_SUPABASE_URL` | `https://abcdefg.supabase.co` | Supabase project URL. Used if the frontend calls Supabase directly (e.g. realtime subscriptions). |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Supabase anonymous/public key. Safe to expose in the browser — RLS policies protect data. |

## Environment Scopes

Vercel lets you scope variables to **Production**, **Preview**, and **Development**.

| Variable | Production | Preview | Development |
|---|:---:|:---:|:---:|
| `VITE_API_BASE_URL` | ✓ (production API) | ✓ (staging API) | ✓ (`http://localhost:3000`) |
| `VITE_SUPABASE_URL` | ✓ | ✓ | ✓ |
| `VITE_SUPABASE_ANON_KEY` | ✓ | ✓ | ✓ |

## Notes

- All frontend env vars **must** be prefixed with `VITE_` to be embedded by Vite at build time.
- Values are baked into the JS bundle at build time — they are **not** secret. Never put API keys with write access here.
- The `VITE_API_BASE_URL` is also used in `vercel.json` rewrites to proxy `/api/*` requests to the backend, avoiding CORS issues.
- After changing any variable, trigger a **redeploy** for the new values to take effect.

## Setup Steps

1. Go to [vercel.com](https://vercel.com) → select the project → **Settings** → **Environment Variables**.
2. Add each variable from the table above.
3. Set the correct scope (Production / Preview / Development).
4. Deploy or redeploy the project.
