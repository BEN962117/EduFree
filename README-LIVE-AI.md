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
