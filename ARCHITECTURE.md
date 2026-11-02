# Architecture

This document describes how the hospice-contatto.it website is put together.
For setup, development and testing commands, see [README.md](README.md).

## Overview

The site is a [Next.js](https://nextjs.org/) application (App Router) whose
content is managed in [DatoCMS](https://www.datocms.com/). Pages are React
Server Components that fetch their content from the DatoCMS GraphQL API when
the site is built.

Next.js is configured with `output: 'export'` (see `next.config.js`), so
`yarn build` produces a fully static site in `out/`. There is no Node.js
server at runtime. Every page, including each paginated list page and each
detail page, is rendered to HTML at build time.

```
DatoCMS (GraphQL) ──build time──▶ Next.js static export ──▶ out/ ──▶ statichost.eu
```

## Directory layout

| Path              | Contents                                                            |
|-------------------|---------------------------------------------------------------------|
| `app/`            | All application code: routes, components, libraries and schema     |
| `app/**/page.tsx` | Route entry points (one directory per URL segment)                  |
| `app/components/` | Shared React components and their CSS Modules                       |
| `app/lib/`        | Infrastructure and helpers that are not tied to one content type    |
| `app/schema/`     | GraphQL fragments, queries and types for each DatoCMS model         |
| `app/fonts/`      | Locally hosted Ubuntu font files                                    |
| `public/`         | Static assets copied as-is into the build                           |
| `tests/`          | Playwright end-to-end tests                                         |

Modules import each other through the `@*` → `./app/*` path alias
(`tsconfig.json`), e.g. `@lib/datocms`, `@schema/event`, `@components/Body`.

Types live in `.d.ts` files next to their implementation
(`event.ts` / `event.d.ts`).

## Routes

URLs are in Italian and map directly onto `app/` directories:

| URL                          | Source                                   | Content                      |
|------------------------------|------------------------------------------|------------------------------|
| `/`                          | `app/page.tsx`                           | Home                         |
| `/chi-siamo`                 | `app/chi-siamo/page.tsx`                 | About                        |
| `/cosa-facciamo`             | `app/cosa-facciamo/page.tsx`             | What we do                   |
| `/come-sostenerci`           | `app/come-sostenerci/page.tsx`           | How to support us            |
| `/contatti`                  | `app/contatti/page.tsx`                  | Contacts                     |
| `/eventi`                    | `app/eventi/page.tsx`                    | Upcoming events              |
| `/eventi/passati[/:page]`    | `app/eventi/passati/…`                   | Past events, paginated       |
| `/eventi/evento/:date-:slug` | `app/eventi/evento/[slug]/page.tsx`      | Single event                 |
| `/diario[/:page]`            | `app/diario/…`                           | Diary entries, paginated     |
| `/approfondimenti[/:detail]` | `app/approfondimenti/…`                  | In-depth articles            |

`app/layout.tsx` wraps every page with `Nav` and `Footer`.

### Dynamic routes and static generation

Because the site is exported statically, every dynamic route exports a
`generateStaticParams` function that queries DatoCMS for the full set of
pages to build:

* **Detail pages** (`evento/[slug]`, `approfondimenti/[detail]`) list all
  records and return one param per slug.
* **Paginated lists** (`diario/[page]`, `eventi/passati/[page]`) read the
  record count from the `_all…Meta` query and return pages `2..n`. Page 1
  is served by the parent route (`/diario`, `/eventi/passati`). Both render
  through a shared component (`DiaryPage`, `EventPage`).

Event URLs carry the date as a prefix (`2024-05-01-my-event`). `lib/event.ts`
builds these "dated slugs" and strips the date off again before querying
DatoCMS by slug.

## Content: DatoCMS

### Requests

`app/lib/datocms.ts` is a thin wrapper around `graphql-request`:

* the endpoint is `https://graphql.datocms.com/`
* it authenticates with `NEXT_DATOCMS_API_TOKEN` (set through `.envrc` /
  `.envrc.private` using direnv)
* it can optionally send `X-Include-Drafts` and `X-Exclude-Invalid`

Pages call `request<T>({query, variables})` with a TypeScript type that
describes the expected response shape. The types are written by hand; they
are not generated from the DatoCMS schema.

### Schema modules

Each DatoCMS model has a module in `app/schema/` that exports GraphQL
**fragments** (as strings) plus, where needed, query helpers and constants:

* `event.ts`: `eventFragment`, `eventListFragment`, `eventRecordLinkFragment`,
  `PAGE_SIZE`, page-count helpers
* `diary.ts`: `diaryEntryFragment`, `pageCount()`, `PAGE_SIZE`
* `info.ts`: `fetchInfo()` for global site information (title,
  description, contact details, default image)
* `home.ts`, `about.ts`, `what-we-do.ts`, `give-support.ts`, `contact.ts`,
  `detail.ts`, `attachment.ts`

Fragments are composed by string interpolation. Pages assemble the final
query near where it is used, usually in a local `QUERY` constant and a
`getData()` function.

Shared fragments that don't belong to a single model live in `app/lib/`:

* `datocms.ts`: `metadataFragment` (`{count}`) and `recordLinkFragment`
* `body.ts`: `bodyFragment` for Structured Text fields, including the
  embedded image blocks and record links
* `responsiveImage.ts`: `responsiveImageFragment({width})`, which asks
  DatoCMS/imgix for an image resized to a maximum width

### Structured Text

Rich content fields (home, about, events, details…) are DatoCMS Structured
Text. `components/Body.tsx` renders them with `react-datocms`'s
`StructuredText`:

* `ImageRecord` / `LargeImageRecord` blocks become `next/image` with a caption
* links to `DetailRecord`s become links to `/approfondimenti/:slug`

## Metadata and SEO

`lib/info.ts` provides `createMetadata(overrides?)`. It returns a Next.js
`generateMetadata` function that:

1. loads site-wide defaults (title, description, default Open Graph image)
   from the DatoCMS `info` record
2. merges in any per-page overrides (title, images)
3. builds the Next.js `Metadata` object, including Open Graph tags

`buildTitle` produces titles of the form `Page title — Site title`.
`toOpenGraphImage` turns a DatoCMS responsive image into an Open Graph image,
working out the MIME type from the file extension.

After every build, the `postbuild` script runs `next-sitemap`
(`next-sitemap.config.js`) to generate `sitemap.xml` and `robots.txt`.

## Images

Images are served by the DatoCMS asset CDN (`www.datocms-assets.com`). The
GraphQL queries ask for an already-resized `responsiveImage` for each case
(200px for list thumbnails, 600–700px for main images).

Static export doesn't support Next.js's image optimization server, so
`images.unoptimized` is `true`. `next/image` emits the CDN URL unchanged, and
DatoCMS/imgix does the resizing.

## Styling

* Sass, with CSS Modules: each component has a `Component.module.sass`
  beside it
* global styles are in `app/globals.sass`
* the preferred approach is CSS custom properties over Sass variables
* the mobile navigation menu is a pure-CSS hamburger driven by a hidden
  checkbox, with a little client-side state in `Nav.tsx` to close it after
  navigation

Most components are Server Components. Only `Nav` and `Body` are marked
`'use client'`.

## Dates and localisation

The site is in Italian only (`<html lang="it">`). `lib/format.ts` formats
dates with the `it-IT` locale and the `Europe/Rome` time zone.

## Testing

* **Unit/component tests**: Vitest + Testing Library in a jsdom
  environment. Spec files sit beside the code (`*.spec.ts(x)` under `app/`).
  DatoCMS calls are mocked with MSW (see `schema/info.spec.ts`).
* **End-to-end tests**: Playwright (`tests/`), against `yarn dev`, on
  desktop Chromium and Firefox plus a mobile (Pixel 5) profile for
  `*.mobile.spec.ts`.

## Deployment

The site is built and hosted by [statichost.eu](https://www.statichost.eu/),
which runs `yarn build` and serves the static files from `out/`. The Node
version is pinned through `engines.node` in `package.json` and
`.tool-versions` for asdf.

### Consequences of the static export

Content is only fetched at build time, so:

* **Edits in DatoCMS appear only after a rebuild.** A statichost.eu build
  has to be triggered (e.g. by a DatoCMS webhook).
* **"Upcoming" vs "past" events are decided at build time.** `/eventi` and
  `/eventi/passati` compare event dates with `new Date()` while building.
  An event moves from upcoming to past only when the site is next built.
