<div align="center">
  <h1 align="center">Papermark</h1>
  <h3>The open-source DocSend alternative.</h3>

<a target="_blank" href="https://www.producthunt.com/posts/papermark-3?utm_source=badge-top-post-badge&amp;utm_medium=badge&amp;utm_souce=badge-papermark"><img src="https://api.producthunt.com/widgets/embed-image/v1/top-post-badge.svg?post_id=411605&amp;theme=light&amp;period=daily" alt="Papermark - The open-source DocSend alternative | Product Hunt" style="width:250px;height:40px"></a>

</div>

<div align="center">
  <a href="https://www.papermark.com">papermark.com</a>
</div>

<br/>

<div align="center">
  <a href="https://github.com/mfts/papermark/stargazers"><img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/mfts/papermark"></a>
  <a href="https://twitter.com/papermarkio"><img alt="Twitter Follow" src="https://img.shields.io/twitter/follow/papermarkio"></a>
  <a href="https://github.com/mfts/papermark/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/badge/license-AGPLv3-purple"></a>
</div>

<br/>

> [!IMPORTANT]
> **This is a community edition of Papermark.** Upstream Papermark keeps
> part of its code under a separate commercial licence (the `ee/` and
> `app/(ee)/` folders) that cannot be used in production without a paid
> subscription, and its public `main` branch also imports four files that
> were never published, so it does not build on its own.
>
> This fork removes every commercially licensed file and replaces what the
> rest of the app needs with new code in [`community/`](community/README.md).
> The whole repository is AGPLv3. Every team gets every feature that lives in
> the open code, with no plan limits.
>
> **Included:** document and data room sharing, page-by-page analytics,
> custom domains, email capture and verification, passwords, expiry,
> allow and block lists, watermarks, NDAs, screenshot protection, confidential
> view, team and data room branding, viewer groups and Word, PowerPoint and
> Keynote to PDF conversion (LibreOffice).
>
> **Not included:** AI chat, Q&A threads, redaction, request lists, workflows,
> data room freeze, templates, email invitations to data rooms, single
> sign-on and billing. These only ever existed in the commercial folders.
>
> See [Running the community edition](#running-the-community-edition) below.

Papermark is the open-source document-sharing alternative to DocSend, featuring built-in analytics and custom domains.

## Features

- **Shareable Links:** Share your documents securely by sending a custom link.
- **Custom Branding:** Add a custom domain and your own branding.
- **Analytics:** Gain insights through document tracking and soon page-by-page analytics.
- **Self-hosted, Open-source:** Host it yourself and customize it as needed.

## Demo

![Papermark Welcome GIF](.github/images/papermark-welcome.gif)

## Tech Stack

- [Next.js](https://nextjs.org/) – Framework
- [TypeScript](https://www.typescriptlang.org/) – Language
- [Tailwind](https://tailwindcss.com/) – CSS
- [shadcn/ui](https://ui.shadcn.com) - UI Components
- [Prisma](https://prisma.io) - ORM [![Made with Prisma](https://made-with.prisma.io/dark.svg)](https://prisma.io)
- [PostgreSQL](https://www.postgresql.org/) - Database
- [NextAuth.js](https://next-auth.js.org/) – Authentication
- [Tinybird](https://tinybird.co) – Analytics
- [Resend](https://resend.com) – Email
- [Stripe](https://stripe.com) – Payments
- [Vercel](https://vercel.com/) – Hosting

## Getting Started

### Prerequisites

Here's what you need to run Papermark:

- Node.js (version >= 18.17.0)
- PostgreSQL Database
- Blob storage (currently [AWS S3](https://aws.amazon.com/s3/) or [Vercel Blob](https://vercel.com/storage/blob))
- [Resend](https://resend.com) (for sending emails)

### 1. Clone the repository

```shell
git clone https://github.com/mfts/papermark.git
cd papermark
```

### 2. Install npm dependencies

```shell
npm install
```

### 3. Copy the environment variables to `.env` and change the values

```shell
cp .env.example .env
```

### 4. Initialize the database

```shell
npm run dev:prisma
```

### 5. Run the dev server

```shell
npm run dev
```

### 6. Open the app in your browser

Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Tinybird Instructions

To prepare the Tinybird database, follow these steps:

0. We use `pipenv` to manage our Python dependencies. If you don't have it installed, you can install it using the following command:
   ```sh
   pkgx pipenv
   ```
1. Download the Tinybird CLI from [here](https://www.tinybird.co/docs/cli.html) and install it on your system.
2. After authenticating with the Tinybird CLI, navigate to the `lib/tinybird` directory:
   ```sh
   cd lib/tinybird
   ```
3. Push the necessary data sources using the following command:
   ```sh
   tb push datasources/*
   tb push endpoints/get_*
   ```
4. Don't forget to set the `TINYBIRD_TOKEN` with the appropriate rights in your `.env` file.

#### Updating Tinybird

```sh
pipenv shell
## start: pkgx-specific
cd ..
cd papermark
## end: pkgx-specific
pipenv update tinybird-cli
```

## Contributing

Papermark is an open-source project, and we welcome contributions from the community.

If you'd like to contribute, please fork the repository and make any changes you'd like. Pull requests are warmly welcome.

### Our Contributors ✨

<a href="https://github.com/mfts/papermark/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=mfts/papermark" />
</a>


## Running the community edition

You need these accounts. All have free tiers.

| Service | What for | Settings |
| --- | --- | --- |
| PostgreSQL (Vercel Postgres, Neon or Supabase) | Database | `POSTGRES_PRISMA_URL`, `POSTGRES_PRISMA_URL_NON_POOLING` |
| S3-compatible storage (AWS S3 or Cloudflare R2) | Uploaded files | `NEXT_PUBLIC_UPLOAD_TRANSPORT=s3` and the `NEXT_PRIVATE_UPLOAD_*` settings |
| Resend | Sign-in and notification emails | `RESEND_API_KEY` |
| Tinybird | View analytics | `TINYBIRD_TOKEN` (push `lib/tinybird` with the Tinybird CLI) |
| Upstash Redis | Rate limiting and upload locks | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `UPSTASH_REDIS_REST_LOCKER_URL`, `UPSTASH_REDIS_REST_LOCKER_TOKEN` |
| Upstash QStash | Background jobs | `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` |
| Trigger.dev | Page rendering and file conversion | `TRIGGER_SECRET_KEY`, `TRIGGER_PROJECT_ID`, then `npm run trigger:v4:deploy` |

Optional: `HANKO_API_KEY` and `NEXT_PUBLIC_HANKO_TENANT_ID` for passkeys,
`SLACK_CLIENT_ID` and `SLACK_CLIENT_SECRET` for Slack alerts,
`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` for Google sign-in. The app
starts without them.

Vercel Blob is no longer enough for uploads: current Papermark needs
S3-compatible storage for server-side file processing.
