This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Install dependencies and run the development server with Yarn:

```bash
yarn install
yarn dev
```

Copy `.env.example` to `.env.local` and provide Supabase credentials before running the app.

## Project Structure

- `web/` – Next.js application (App Router, UI, API routes)
- `server/prisma/` – Prisma schema and generated client output
- `server/supabase/` – Supabase CLI project configuration

## Supabase Local Development

Spin up the Supabase stack locally (Postgres, Auth, Realtime, Storage):

```bash
yarn supabase:start
```

Stop services or check status with:

```bash
yarn supabase:stop
yarn supabase:status
```

Reset the local database:

```bash
yarn supabase:db:reset
```

> Supabase CLI commands require Docker; make sure the Docker daemon is running locally first.
> If you're relying on a hosted Supabase instance, you can skip these commands and just point the env vars to your cloud project.

## Prisma ORM

Generate the Prisma client and apply schema changes with:

```bash
yarn prisma:generate
yarn prisma:migrate dev
```

Inspect data locally:

```bash
yarn prisma:studio
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `web/app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
