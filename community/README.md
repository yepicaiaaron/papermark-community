# Community replacements

Papermark ships some modules under a separate commercial licence (the `ee/`
and `app/(ee)/` folders). This fork removes those folders completely.

Everything in `community/` is new code written for this fork from the way
the AGPL-licensed parts of Papermark call into those modules. No code was
copied from the commercially licensed folders. This folder is licensed under
AGPLv3, like the rest of the repository.

What this folder does:

- **Plans and limits** - every team is treated as having no limits. There is
  no billing.
- **Storage** - a single S3-compatible bucket configured from environment
  variables, or Vercel Blob.
- **Data room share links** - built on the existing link sheet.
- **Branding** - team and data room branding helpers.
- **Security** - rate limiting through Upstash.

Features that only existed in the commercial folders are switched off and
render nothing: AI chat, Q&A conversations, redaction, request lists,
workflows, data room freeze, templates, invitations, single sign-on,
referrals and billing.
