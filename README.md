# Thaiarthub

Thai-first discovery platform for artists and creators across creative disciplines. This repository currently contains the technical bootstrap for the MVP journey: **Discover → Explore Artist/Artwork → Contact Creator**.

## Tech stack

- Next.js (App Router), TypeScript, Tailwind CSS, ESLint
- shadcn/ui configuration and shared UI utilities
- Supabase SSR client foundation
- Zod validation schemas

## Local setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`.

## Environment setup

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` after creating a Supabase project. Do not commit `.env.local` or real credentials.

## Commands

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
pnpm start
```

## Current MVP scope

The foundation includes responsive Thai-first navigation, public route skeletons, protected-area placeholders, shared entity types, and initial Zod schemas. It deliberately excludes payments, checkout, favorites, private messaging, recommendations, advanced search, marketplace behavior, complex moderation, production maps, native apps, microservices, Elasticsearch, and Redis.

See [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) for architectural decisions and next milestones.
