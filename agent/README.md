# Frank — From Idea to Backlog in Minutes

> The AI that structures your thinking before you build.  
> Structured epics. Prioritized stories. Developer-ready output. GitHub export included.

## What it does

1. **Hard-gates the Quick Brief** — no epics until you answer why, who, and what you're assuming
2. **Guides a 5-step Idea Intake Protocol** — problem statement, target user, success metrics, scope box, constraints
3. **Auto-generates a prioritized backlog** — Epics → User Stories → Acceptance Criteria with auto-computed value scores
4. **Progressive backlog saving** — each Epic is checkpointed as it's generated; a dropped connection never loses completed work
5. **Produces the Greatest Value Prompt** — a copy-paste developer prompt for the highest-impact story
6. **Exports to GitHub Issues** — one issue per user story with labels, AC, metadata
7. **Persistent sessions** — every session gets a shareable URL; reload anytime

## Tech Stack

- **Next.js 15** (App Router, Server Components)
- **Vercel AI SDK v4** + **OpenAI GPT-4o** (streaming, tool calling)
- **Upstash Redis** (session + conversation persistence, free tier)
- **GitHub API** (Issues export)
- **Tailwind CSS** (dark command-center UI)

## Setup

### 1. Install dependencies

```bash
cd agent
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

| Variable | Where to get it |
|---|---|
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `UPSTASH_REDIS_REST_URL` | [console.upstash.com](https://console.upstash.com) → Create Database → REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Same page → REST Token |
| `NEXT_PUBLIC_BASE_URL` | `http://localhost:3000` for dev, your domain for prod |
| `ADMIN_SECRET` | Run `openssl rand -hex 32` — used for the session recovery PATCH endpoint |
| `GITHUB_TOKEN` | Optional server-side token — users can also enter theirs in the UI |

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Your session URL will look like `/?s=abc1234567`.

## Usage

1. **Describe your idea** in the chat (rough is fine)
2. **Answer the 3 Quick Brief questions** — Frank enforces this gate
3. **Complete the 5-step intake** — problem, user, success, scope, constraints
4. **Receive your full backlog** — epics, stories, AC, value scores, Greatest Value Prompt
5. **Click Export to GitHub** in the top bar — enter your repo and token
6. **Share the URL** with stakeholders or developers to resume anytime

## Deploy to Vercel

```bash
# From the agent/ directory
npx vercel
```

Set all environment variables in the Vercel dashboard. Set **Root Directory** to `agent/` if deploying from the parent repo.

> **Note:** Vercel Hobby plan has a 60s function timeout. Complex backlogs (6+ epics) may approach this limit. Upgrade to Pro for 300s timeout if needed.

## Session Sharing

Every session gets a unique URL: `https://your-app.vercel.app/?s=abc1234567`

- Share with a product manager to review the backlog
- Share with developers to see the stories and prompts
- Sessions persist for 30 days from last activity

## Architecture

```
app/page.tsx              ← Server Component — loads session, redirects if no ID
app/api/chat/route.ts     ← Edge route — streamText with GPT-4o + tools
app/api/session/[id]/     ← GET session data (used for backlog panel refresh)
app/api/export/github/    ← POST — exports backlog to GitHub Issues
lib/instructions.ts       ← System prompt (the hard gate + all stages)
lib/redis.ts              ← Upstash session layer
lib/github.ts             ← GitHub Issues API client
components/ChatInterface  ← Main UI — useChat hook + layout
components/BacklogPanel   ← Sidebar — stage progress + epic/story tree
components/ExportButton   ← GitHub export modal
```
