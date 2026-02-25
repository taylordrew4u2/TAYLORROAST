# TAYLORROAST – Comedy Roast Tournament Check-In App

A web application for a stage manager to manage check-ins for a **Comedy Roast Tournament**. Built with **Next.js 15**, **Tailwind CSS**, **Prisma ORM**, and **Vercel Postgres**.

## Features

- 🎤 **Group grid** – responsive cards showing all roast groups
- ✏️ **Inline editing** – click any group or member name to rename it
- ✅ **Check-in toggles** – tap the circle next to each member to mark them checked in / out
- ➕ **Add / delete groups and members** – full CRUD with instant UI feedback
- 🔍 **Search** – filter groups by name in real time
- 💾 **Persistent storage** – all data saved to Vercel Postgres (survives page reloads)

---

## Data Model

```
groups
  id         TEXT (cuid)   PRIMARY KEY
  name       TEXT          NOT NULL
  createdAt  TIMESTAMP     DEFAULT now()

members
  id         TEXT (cuid)   PRIMARY KEY
  groupId    TEXT          REFERENCES groups(id) ON DELETE CASCADE
  name       TEXT          NOT NULL
  checkedIn  BOOLEAN       DEFAULT false
  createdAt  TIMESTAMP     DEFAULT now()
```

---

## Local Development

### Prerequisites
- Node.js 18+
- A PostgreSQL database (local or cloud)

### 1. Clone & install

```bash
git clone https://github.com/taylordrew4u2/TAYLORROAST.git
cd TAYLORROAST
npm install
```

### 2. Environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

### 3. Generate Prisma client & run migrations

```bash
npx prisma generate
npx prisma migrate deploy
```

### 4. Start dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment on Vercel

1. Push the repo to GitHub.
2. In **Vercel Dashboard → Storage**, create a new **Postgres** database and link it to your project.  
   Vercel will automatically inject `DATABASE_URL` and `POSTGRES_*` environment variables.
3. Import the repo in Vercel. The `vercel.json` build command (`npx prisma generate && next build`) will generate the Prisma client before building.
4. Run the initial migration by executing in your Vercel project's database console (or using the Vercel CLI):

```bash
npx vercel env pull .env.local   # pull env vars locally
npx prisma migrate deploy        # apply migrations to production DB
```

### Environment Variables Reference

| Variable | Description |
|---|---|
| `DATABASE_URL` | Full Postgres connection string (set automatically by Vercel Postgres) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS v4 |
| ORM | Prisma 7 |
| Database | Vercel Postgres (PostgreSQL) |
| Hosting | Vercel |
