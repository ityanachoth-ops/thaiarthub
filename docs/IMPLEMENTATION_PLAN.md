# Thaiarthub implementation plan

## Architecture

Next.js App Router provides the presentation and server boundary. The codebase is a modular monolith: shared primitives live in `src/components`, `src/lib`, and `src/types`; feature code will live under `src/modules/{artists,artworks,events,categories,search,accounts}`. Each module should own its UI, queries, commands, schemas, and tests while sharing only stable contracts.

## Route structure

Public discovery: `/`, `/artists`, `/artists/[username]`, `/artworks`, `/artworks/[slug]`, `/events`, `/events/[slug]`, `/map`, `/categories/[slug]`, and `/search`. Creator and administration foundations are `/dashboard` and `/admin`; both must be authenticated and authorized before functionality is added.

## Core entities

- `profiles`: user identity and role metadata linked to Supabase Auth.
- `artist_profiles`: public creative profile, username, biography, disciplines, contact destination, publication state.
- `artworks`: artist-owned work, slug, description, media references, discipline, publication state.
- `events`: public event listing, slug, schedule, venue, publication state.
- `categories`: controlled creative disciplines used for discovery.

## Supabase plan

Use `@supabase/ssr` browser and server clients in `src/lib/supabase`. Store public configuration in `.env.local`; never commit credentials. Create migrations for the entities above, storage buckets for public media, and generated database types after schema stabilizes. Query public records from Server Components; use Route Handlers or Server Actions for authenticated writes.

## RLS and security

Enable RLS on every table. Anonymous visitors can select only published artist profiles, artworks, and events. Authenticated creators can read and change only records they own. Administrator access must use a role claim checked in database policies and server code; do not expose service-role credentials to the browser. Validate all mutations with Zod and enforce authorization in the database rather than the UI.

## Environment variables

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are required for Supabase clients. Copy `.env.example` to `.env.local`. Future server-only values, if truly required, must not use the `NEXT_PUBLIC_` prefix.

## Implementation milestones

1. Bootstrap (complete): framework, UI setup, route skeleton, clients, types, schemas, and docs.
2. Data foundation: migrations, RLS, Auth flow, storage policy, and typed repositories.
3. Discovery: published artist/artwork/event listing and detail queries.
4. Creator workflow: profile and artwork management in the dashboard.
5. Operations: minimal admin review controls and observability.

## Assumptions

Thai is the primary interface language. The MVP supports discovery, exploration, and a creator-provided contact destination. A future map view needs a product-approved provider and geographic data model.

## Known TODOs

- Connect and configure a Supabase project.
- Add migrations, RLS policies, Auth middleware, and generated database types.
- Replace placeholder routes with data-backed views.
- Define media storage and image processing constraints.
- Decide contact UX and moderation policy before enabling submissions.
- Do not add payments, favorites, private messaging, recommendations, advanced search, marketplace functionality, complex moderation, a production map, mobile apps, microservices, Elasticsearch, or Redis during this phase.
