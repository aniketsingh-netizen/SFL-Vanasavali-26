# Vansavali

A family-history workspace for exploring connected lineages, member profiles, relationships, and historical timelines. The app uses React, TypeScript, Tailwind CSS, React Flow, Express, Prisma, and PostgreSQL.

## Requirements

- Node.js 20+
- npm 10+
- PostgreSQL 15+

## Initialize and run

```sh
# 1. Install all workspace dependencies
npm install

# 2. Create a PostgreSQL database (one option)
createdb vansavali

# 3. Copy .env.example to .env and apps/api/.env; update DATABASE_URL in both

# 4. Generate Prisma Client and apply the checked-in migration
npm run db:generate
npm run db:migrate

# 5. Start the API and frontend
npm run dev
```

The web app is available at http://localhost:5173 and the API at http://localhost:4000. The API health check is `GET /api/health`. For local development, set `WEB_ORIGIN` and `VITE_API_URL` in `.env` as needed.

## GitHub Pages preview

Pushing frontend or workflow changes to `main` runs `.github/workflows/deploy-pages.yml`, which builds the sample-data preview at `https://aniketsingh-netizen.github.io/SFL-Vanasavali-26/`. If Pages has not been enabled for the repository yet, select **Settings → Pages → Build and deployment → GitHub Actions**. The Pages site is a public, browser-only demo; it does not connect to the Express API or PostgreSQL. Visitor changes remain in their own browser.

## Live preview

The browser-only preview needs no database or API server:

```sh
npm run dev:demo --workspace @vansavali/web
```

Open the Vite URL printed in the terminal (normally http://localhost:5173). The preview starts with sample family data, works offline after the dependencies are installed, and saves edits only in that browser's local storage. Use **Preview · reset** in the header to restore the sample family. Do not enter real personal data in a shared preview. For a database-backed app, use the normal setup above instead.

Useful commands:

```sh
npm run build       # Type-check and build both workspaces
npm test            # Run API unit tests
npm run db:studio   # Open Prisma Studio
```

## Data model

- **Lineage** groups members into named family branches and can be linked to a parent lineage to represent interconnected maternal and paternal sides.
- **Member** stores names, dates, places, occupation, biography, and an optional photo URL. Members can belong to multiple lineages.
- **Relationship** stores a directional `PARENT_CHILD` edge or an unordered `SPOUSE` / `SIBLING` pair. A database unique key prevents duplicate edges. API validation rejects self-edges, invalid endpoints, and parent-child cycles.
- **TimelineEvent** is a member-associated event such as a birth, migration, or achievement.
- **HistoricalEvent** is an optional shared/global event that can be shown alongside family events.

Dates are represented as PostgreSQL dates where possible; biographies support Markdown formatting and are rendered without trusting user-provided HTML. Photo URLs are references only; upload/storage is intentionally left to a future media provider.

## API

All routes are prefixed with `/api`.

| Method | Route | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET, POST | `/lineages` | List or create lineages |
| GET, PATCH, DELETE | `/lineages/:id` | Read, update, or delete a lineage |
| GET, POST | `/members` | Search/list or create members |
| GET, PATCH, DELETE | `/members/:id` | Read, update, or delete a member |
| GET, POST | `/relationships` | List or create relationships |
| PATCH | `/relationships/:id` | Update a relationship |
| DELETE | `/relationships/:id` | Remove a relationship |
| GET, POST | `/events` | List or create family timeline events |
| PATCH, DELETE | `/events/:id` | Update or remove a family event |
| GET, POST | `/historical-events` | List or create shared historical events |

`GET /members` accepts `q`, `generation`, `location`, `birthFrom`, `birthTo`, and `lineageId` query parameters. `GET /relationships?lineageId=...` filters edges to the selected lineage. Inputs are validated with Zod; errors return `{ "error": "..." }` with an appropriate 4xx status.

## Tree behavior

The React Flow view lays out generations vertically, pairs partners horizontally, and connects parent-child relationships. Sibling relationships are available as explicit data and are represented in the tree’s member set; biological/adoptive distinctions and complex pedigree-collapse layouts can be layered onto the typed relationship model later.

## Project layout

```text
apps/
  api/                 Express API, Prisma schema, migration, and tests
  web/                 React UI, Tailwind styles, and React Flow tree
```
