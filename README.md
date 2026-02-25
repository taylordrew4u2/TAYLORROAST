# 🎤 Taylor Roast — Check-In Manager

A web application for stage managers to manage group check-ins during a **Comedy Roast Tournament**. Built with Next.js, Tailwind CSS, and Turso.

---

## Features

| Feature | Details |
|---------|---------|
| **Group Management** | Create, rename, delete groups in an editable card grid |
| **Member Management** | Add, rename, remove members within any group |
| **Check-In Toggle** | One-tap check-in / un-check-in with large touch targets |
| **Instant Persistence** | Every change is saved to Turso immediately — data survives page refreshes and reloads |
| **Optimistic UI** | Changes appear instantly in the UI; rolled back automatically on error |
| **Search / Filter** | Filter groups and members by name |
| **CSV Export** | Download the full check-in list as a CSV file |
| **Responsive** | Works on tablets, laptops, and phones |

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) v4
- **Database**: [Turso](https://turso.tech/) (libSQL)
- **Data Fetching**: [SWR](https://swr.vercel.app/) with optimistic mutations
- **Deployment**: [Vercel](https://vercel.com/)

---

## Data Model

```
┌──────────┐         ┌──────────────┐
│  groups   │ 1 ── ∞ │   members    │
├──────────┤         ├──────────────┤
│ id (PK)  │         │ id (PK)      │
│ name     │         │ group_id (FK)│
│ created_at│        │ name         │
└──────────┘         │ checked_in   │
                     │ created_at   │
                     └──────────────┘
```

- Tables are created automatically on first request (`CREATE TABLE IF NOT EXISTS`).
- `ON DELETE CASCADE` on `members.group_id` ensures deleting a group removes its members.

### How Persistence Is Guaranteed

1. **Every UI action** (create, edit, delete, check-in toggle) triggers an HTTP call to a Next.js API route.
2. The API route executes a SQL statement against Vercel Postgres and returns the updated row.
3. SWR performs an **optimistic update** (instant UI feedback) then **re-validates** from the server.
4. If the API call fails, SWR **rolls back** the optimistic change and the UI shows the previous state.
5. A 30-second polling interval acts as a safety net to catch any drift.

**Result**: the database is always the single source of truth. No data lives only in local state.

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Turso database and auth token

### 1. Clone the repo

```bash
git clone https://github.com/taylordrew4u2/TAYLORROAST.git
cd TAYLORROAST
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example file and fill in your Turso connection details:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token
```

> **Tip**: Keep `.env.local` out of source control. `.gitignore` already excludes it.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Deploy to Vercel

```bash
npx vercel --prod
```

Or push to GitHub and connect the repo in the Vercel dashboard — it will deploy automatically.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Turso/libSQL URL (`libsql://...`) |
| `TURSO_AUTH_TOKEN` | Yes | Turso auth token for the database |

Set these in `.env.local` for local development and in your deployment provider's environment settings for production.

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── groups/route.ts    # CRUD for groups
│   │   └── members/route.ts   # CRUD for members
│   ├── Dashboard.tsx           # Main client-side dashboard
│   ├── GroupCard.tsx            # Group card component
│   ├── globals.css              # Tailwind import
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Entry page
├── lib/
│   ├── csv.ts                   # CSV export utility
│   ├── db.ts                    # Database helpers & schema
│   └── useGroups.ts             # SWR hook for all data operations
```

---

## Key Design Decisions

1. **SWR with optimistic mutations** – gives instant UI feedback while ensuring the database is always updated. Rollback on failure prevents phantom edits.
2. **Auto-migrating schema** – `ensureSchema()` runs `CREATE TABLE IF NOT EXISTS` on every read, so the database bootstraps itself on first deploy with zero manual migration steps.
3. **API routes (not Server Actions)** – chosen for clarity and debuggability; each HTTP method maps to a specific operation.
4. **Single SWR key** – all groups and members are fetched together as a single dataset. This simplifies cache management and avoids partial-state bugs at moderate scale.
5. **No ORM** – direct SQL via `@vercel/postgres` keeps the dependency footprint tiny and queries transparent.

---

## License

MIT
