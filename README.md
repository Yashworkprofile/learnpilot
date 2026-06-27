# Course Tracker — Next.js frontend

Next.js frontend for the Udemy course tracker, replacing the retired
Streamlit dashboard. Talks to the FastAPI backend described in
`NEXT_SESSION_CONTEXT.md`.

## Status

**Shell + design system: done.** Sidebar, header, ambient background, glass
primitives, routing between all 5 tabs, and an active-course selector are
built and working.

**Dashboard tab: done, live-mode only.** KPI cards (overall completion ring,
lectures completed, sections completed), the Up Next hero card, the
Completion Overview donut + legend, week-by-week Module Completion bars, and
the collapsible Course Sections accordion are all wired to `GET /progress`,
with loading and error states.

Transcripts, Lecture Workspace, Summaries, and RAG Chat still render
placeholders — built tab-by-tab in upcoming passes.

Demo mode (`NEXT_PUBLIC_DEMO_MODE`) is intentionally not implemented yet —
this pass is live-mode only, per the agreed build order.

## Setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Requires the FastAPI backend running at the URL in `.env.local`
(`http://localhost:8000` by default) for any tab that fetches real data —
none do yet in this pass.

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4 (CSS-based theme config — see `app/globals.css`, no
  `tailwind.config.ts`)
- `next/font/google` for Inter (UI) and JetBrains Mono (metrics/code)
- `lucide-react` for icons

## Structure

```
app/
  layout.tsx           Root layout — fonts, ambient background, app shell
  page.tsx              Redirects to /dashboard
  dashboard/page.tsx     Real — KPI cards, Up Next, donut, module bars, accordion
  transcripts/page.tsx   } placeholder pages, wired in upcoming passes
  workspace/page.tsx     } (see "Status" above)
  summaries/page.tsx     }
  chat/page.tsx          }
components/
  layout/
    AmbientBackground.tsx   Three drifting blurred orbs
    AppShell.tsx             Composes Sidebar + Header + main content area
    Sidebar.tsx               Nav, active-course selector, API status pill
    Header.tsx                 Search bar, course title, notifications, avatar
  ui/
    GlassCard.tsx           Base glass/glass-strong/glass-soft surface
    ProgressRing.tsx         Reusable SVG ring (KPI rings + completion donut)
    ComingSoonPanel.tsx      Placeholder used by not-yet-wired tabs
  dashboard/
    KpiCards.tsx             Overall completion / lectures / sections cards
    UpNextCard.tsx            Resume-point hero card
    CompletionOverview.tsx     Donut + Completed/In progress/Not started legend
    ModuleCompletion.tsx       Week-by-week progress bars
    SectionAccordion.tsx       Collapsible per-section lecture list
hooks/
  useSidebar.tsx     Sidebar collapsed/expanded state
  useCourse.tsx       Active course context (placeholder course list —
                       see comment in the file re: backend course-list endpoint)
  useProgress.tsx     Fetches GET /progress for the active course
lib/
  types.ts           Shared types: Course, plus the full ProgressResponse
                      shape mirroring GET /progress
  api.ts             Typed live-mode fetch wrappers (demo-mode branch added
                      in a later pass)
  format.ts          formatPercent() shared by dashboard cards
```

## Design system

Dark glassmorphism, matched against the uploaded `course-tracker-themes.html`
reference and the design tokens in `NEXT_SESSION_CONTEXT.md`. All values live
as CSS custom properties and utility classes in `app/globals.css`:
`--bg`, `--accent-from`/`--accent-to`/`--accent-2`, and the `.glass`,
`.glass-strong`, `.glass-soft`, `.grad-accent`, `.grad-text`, `.glow`,
`.nav-active` classes. Only the dark-purple theme from the reference file is
implemented (the white/midnight variants in that file were exploratory and
weren't called out as required in the design system spec).

## Next steps

1. Transcripts tab — `GET /lectures`, `GET /transcript/{id}`
2. Lecture Workspace tab — transcript viewer + notes (localStorage)
3. Summaries tab — `GET /summary/course`, `GET /summary/{id}`
4. RAG Chat tab — `POST /rag/ask` (once that endpoint is added to `app.py`,
   per TODO #1 in `NEXT_SESSION_CONTEXT.md`)
5. Demo mode branch in `lib/api.ts`, once live mode is fully wired
