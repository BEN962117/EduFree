# EduFree — Free feedback setup (Supabase + Render + Resend)

This package includes the 400-topic EduFree website and a feedback backend that stores messages in Supabase (rather than local server files). The Supabase secret key is used only by the Node.js server.

## Supabase database

The `public.feedback` table must contain: `id`, `category`, `message`, `created_at`, `status`. The SQL used earlier creates these columns and enables Row Level Security.

Because the Node server writes using the Supabase secret key, remove the anonymous insert policy so students cannot bypass the rate-limited backend. In Supabase SQL Editor, run:

```sql
drop policy if exists "Students can submit feedback" on public.feedback;
```

Keep RLS enabled. The server's secret key bypasses RLS and must never be placed in the website.

## Server environment variables

Set these in the hosting provider's private environment settings:

- `ALLOWED_ORIGIN=https://ben962117.github.io`
- `SUPABASE_URL` = the Supabase Project URL
- `SUPABASE_SECRET_KEY` = the Supabase **Secret key** (starts with `sb_secret_`) from Project Settings → API Keys. Never use the publishable key for this server variable, and never share the secret key.
- `FEEDBACK_ADMIN_USER` = a private dashboard username
- `FEEDBACK_ADMIN_PASSWORD` = a long, unique password
- `RESEND_API_KEY` = optional; required for email alerts
- `FEEDBACK_TO_EMAIL` = the email address that should receive notifications
- `FEEDBACK_FROM_EMAIL` = a sender address verified with Resend

Do not add any of these secrets to `index.html`, GitHub, or a public repository. A parent/guardian should supervise account and hosting setup, especially for a project used by students.

## Frontend connection

In `index.html`, set `EDUFREE_FEEDBACK_API` to the deployed backend base URL, without a trailing slash, for example `https://your-service.onrender.com`.

## Important free-plan limits

Render free web services may sleep when inactive. Supabase Free projects may pause after inactivity and have usage limits. Resend free sending limits apply. Email notifications are alerts; the dashboard/database is the record of feedback. Test with non-personal sample messages before inviting students.

The feedback system is not live until the backend is deployed and all environment variables are configured. The admin page is at `/admin/feedback` and uses HTTP Basic Authentication over HTTPS.
