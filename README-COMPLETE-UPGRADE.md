# EduFree Complete Upgrade — 400 Topics + Feedback

This package combines the 400-topic project-learning version of EduFree with the feedback submission and admin/email notification system.

## Included
- 8 subjects with 50 topics each (400 total)
- Topic explanations, examples, practice, project activities and checks as included in the project-learning build
- Student feedback form in the website
- Backend endpoint to save feedback
- Private admin page at `/admin/feedback`
- Optional email notifications through Resend
- Existing PWA/offline files and logo

## Important setup notes
The feedback form will not send or store messages online until the Node.js backend is deployed and the frontend API URL is set to that backend's address. The admin page requires `FEEDBACK_ADMIN_USER` and `FEEDBACK_ADMIN_PASSWORD`.

For email alerts, configure `RESEND_API_KEY`, `FEEDBACK_TO_EMAIL`, and `FEEDBACK_FROM_EMAIL` on the server. The sender address must be verified with the email provider. Configure persistent disk storage at `/var/data` so saved feedback survives server restarts/redeployments.

The AI tutor is optional and is not required for the feedback system or topic library. Leave `OPENAI_API_KEY` unset if you are not enabling the AI tutor.

Because EduFree is intended for students, collect only the minimum information needed. The feedback form does not ask students for names or contact details. Before public launch, add a clear privacy notice and have an adult review the hosting, security, moderation, and data-retention settings.
