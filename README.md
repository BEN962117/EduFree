# EduFree expanded starter

## What's included
- Responsive subject library with topic search and education-level filters.
- Sample topic lessons and multiple-choice checks.
- Progress saved locally in the browser.
- English, French and Kirundi interface labels.
- Guided sample tutor that explains included topics step by step.
- PWA manifest and service worker for caching the app shell after the first visit.

## Publish with GitHub Pages
1. Extract this ZIP.
2. Upload **all contents** (not the enclosing folder) into the root of your GitHub repository.
3. Ensure the main page is named `index.html`.
4. In repository Settings → Pages, choose Deploy from a branch, `main`, `/(root)`, then Save.
5. Open the published HTTPS address once while online. The service worker then caches the app shell for later offline visits.

## Important AI note
The tutor in this starter is a guided demo, not a connected generative AI model. To enable open-ended live AI, create a small server/backend endpoint that authenticates requests, protects the API key in server-side environment variables, applies rate limits and age-appropriate safety controls, and returns tutor responses. Then replace the `tutorAnswer()` demo function in `index.html` with a request to that endpoint. Never expose a secret API key in browser JavaScript or GitHub Pages.

## Offline note
The website shell and bundled sample lessons can be cached. The AI tutor needs internet access. Browser storage may be cleared by the user or device, and service workers require HTTPS (GitHub Pages provides HTTPS).


## Expanded learning library

The current catalogue contains 8 subjects with 50 topics each (400 topics total). The 3 original sample lessons in each subject retain their detailed notes and quizzes. Newly added topics include introductory guidance and a practice prompt; they can be expanded into full lesson notes and topic-specific quizzes in later updates.
