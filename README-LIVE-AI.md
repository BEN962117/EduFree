# EduFree 2.1 — Live AI backend starter

This package connects EduFree to a real AI model through a private Node.js backend.

## Before deployment
- A parent or legal guardian should manage the AI provider account, billing and deployment secrets. OpenAI's terms require parent/guardian permission for users under 18.
- API usage may cost money. Set a small usage budget/limit and monitor it before sharing the site.
- Never put the API key in `index.html`, GitHub, screenshots or public chats.
- This starter has basic CORS and per-IP rate limiting, but is not a complete production platform for a large public audience. Add authentication/abuse controls, privacy notices, moderation/reporting and age-appropriate safeguarding before inviting lots of children.
- Do not collect student names, addresses, phone numbers, passwords or other unnecessary personal information in tutor chats. Review applicable child privacy laws and parental-consent requirements.

## A — Deploy the backend (adult/guardian should help)
1. Create an OpenAI API project and key with the adult/guardian's help. Check current API pricing and set a spending limit.
2. Deploy the `server` folder as a Node web service. The included `render.yaml` is a Render blueprint.
3. Set private environment variables in the hosting provider:
   - `OPENAI_API_KEY` = secret API key
   - `OPENAI_MODEL` = `gpt-5.5` (or another model available to the API project)
   - `ALLOWED_ORIGIN` = `https://ben962117.github.io`
4. Deploy. Open `https://YOUR-BACKEND-HOST/health`; it should return `{"ok":true,...}`.
5. Copy the backend's HTTPS base URL.

## B — Connect the website
1. Open `index.html` in the EduFree GitHub repository.
2. Find `const EDUFREE_API_URL = 'https://YOUR-EDUFREE-BACKEND.onrender.com';`
3. Replace the placeholder with the real HTTPS backend URL, keeping the quotes.
4. Commit the change and wait for GitHub Pages to publish.
5. Open EduFree online → AI Tutor → ask a question.

## How it works
The browser sends a question to `/api/tutor`. The server calls the OpenAI Responses API and returns generated text. The key stays on the server. Tutor responses support English, French and Kirundi and adapt to learner level.

## Offline
Lessons and quizzes remain available from the PWA cache. Live generated AI requires internet.

## Troubleshooting
- Placeholder connection message: set the real backend URL in `index.html`.
- CORS error: set `ALLOWED_ORIGIN` to the exact website origin, without a trailing slash.
- `502`: check server logs and API key/model configuration.
- `429`: the API or rate limit was reached; wait and check usage/billing.

## Official references
- https://developers.openai.com/api/docs/quickstart
- https://developers.openai.com/api/reference/overview
- https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance

## C — Student feedback, private dashboard and email alerts
The updated website includes a student feedback form. The Node backend saves submissions to `FEEDBACK_FILE`, and can send an email notification through Resend. The private dashboard is available at `https://YOUR-BACKEND-HOST/admin/feedback` and uses HTTP Basic Authentication.

1. A parent/guardian or site administrator should create and manage the hosting, email-provider account, private admin credentials and any billing. Do not put these secrets in GitHub or in `index.html`.
2. The Render blueprint now uses a paid Starter web service with a 1 GB persistent disk mounted at `/var/data`. Persistent storage is important: a normal ephemeral web-service filesystem can lose feedback when the service restarts or redeploys. Check current Render pricing before deploying; do not deploy a paid service without adult approval.
3. Set `FEEDBACK_ADMIN_USER` and a long unique `FEEDBACK_ADMIN_PASSWORD` in the Render environment settings. Keep them private. Use a password manager managed by the adult administrator.
4. For email alerts, verify a sending domain with Resend, then set `RESEND_API_KEY`, `FEEDBACK_TO_EMAIL` and `FEEDBACK_FROM_EMAIL`. The From address must use a verified domain. Email is only a notification; the dashboard/storage is the record of submissions.
5. Deploy the backend and open `/health`. Then open `/admin/feedback` and sign in with the admin username/password. Share that dashboard URL only with authorized administrators.
6. In `index.html`, replace `https://YOUR-EDUFREE-BACKEND.onrender.com` in `EDUFREE_FEEDBACK_API` with the deployed backend URL. Commit the website change to GitHub Pages.
7. Test by submitting a harmless test message. Confirm it appears in the private dashboard and that the email notification arrives.

The feedback form deliberately does not ask students for names, email addresses, phone numbers or school identifiers. Tell students not to include personal information. Review submissions regularly and establish a clear process for handling safety reports. This starter is not a full safeguarding or case-management system.

If you are not ready to deploy the paid backend, keep the feedback form unpublished until a trusted adult administrator can configure storage, credentials and email. The form cannot deliver or retain feedback while the backend URL is still a placeholder.
