# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. Treat it as the project's operating system — not a suggestion list.

## What This App Is (and Is Not)

This is a **weekly planner**. Not a calendar app. Not a scheduling tool. Not a productivity suite.

One user. One week. Full focus.

The core problem: people need a calm, focused place to decide what matters this week, track it day by day, and reflect on what actually happened. Everything in this project serves that single purpose. If a feature doesn't make the current-week planning experience meaningfully better, it doesn't belong here yet.

- The primary view is always **the current week** (Mon–Sun)
- Past weeks become read-only — archived for reflection, not editing
- The experience must feel clean, calm, and minimal — no visual clutter, no feature overload
- iPhone Safari is a first-class target, not a responsive afterthought
- This is a single-user tool. Social, sharing, and collaboration are explicitly deferred until the solo experience is excellent

## First-Principles Thinking

Apply these before every implementation decision:

1. **"Does this help someone plan their week better?"** If the answer isn't a clear yes, stop. Don't build it.
2. **Start from the user's actual workflow, not from features.** The user opens the app, sees their week, adds/adjusts tasks, checks things off, moves on. Protect that flow above all else.
3. **Favor clarity over cleverness.** In code, in UI, in architecture. If it needs a comment to explain why it's smart, it's too clever.
4. **Mobile is not a media query — it's a design target.** Every interaction must work with one thumb on a phone screen. If it doesn't work on iPhone Safari, it's broken.
5. **Addition is easy. Removal is painful.** When uncertain about a feature, leave it out. You can always add it next week. You can rarely remove it without disrupting users.
6. **This is not Google Calendar.** Reject features that pull toward generic calendar territory — multi-calendar views, complex recurrence rules, timezone management, invite flows. Stay opinionated about weekly planning.

## 80/20 Prioritization

Build the 20% that delivers 80% of the value. Then stop and validate.

**The core 20% (build this first):**
- A clean weekly view with day-level task and event slots
- Add, edit, complete, delete tasks and events within the current week
- Local persistence so data survives a page refresh
- A layout that genuinely works on both desktop and iPhone — not "works if you squint"

**The other 80% (defer all of this):**
- Social features, sharing, collaboration — the single-user experience must be excellent first
- Recurring events, advanced scheduling, drag-across-weeks — complexity that serves power users before the basics are solid
- AI summaries, smart suggestions, automation — premature intelligence over a half-built foundation
- Push notifications — the app is opened intentionally, not pushed to
- Calendar integrations (Google, Apple, Outlook) — adds coupling and complexity before the standalone value is proven

**The rule:** prefer a simple solution that ships today over a perfect system that ships next month. Momentum compounds.

## Product Scope

### MVP — the smallest thing that delivers real value
- Current week view (Mon–Sun) with tasks and events per day
- CRUD operations for tasks and events
- Local data persistence (localStorage)
- Responsive layout tested on desktop Chrome and iPhone Safari
- Minimal, calm visual design — no decoration without purpose

### Hard no (for now)
- Authentication, accounts, backend, database
- Multi-user anything
- Notifications or reminders
- Recurring events
- Calendar sync/import/export
- AI features
- Settings pages, onboarding flows, or admin panels

### Earned later (once the core is solid)
- Past week archive with read-only summary views
- Weekly reflection prompts
- Theme support (light, dark, blue)
- i18n (English → Simplified Chinese)
- Data export
- Optional backend with sync

Items move from "hard no" to "earned later" only when the core weekly planning flow is complete, tested, and usable.

## Tech Stack

- **Next.js (App Router) + TypeScript** — framework and language, no exceptions
- **Tailwind CSS** — utility-first styling, mobile-first breakpoints
- **shadcn/ui** — use for complex interactive components (dialogs, dropdowns, etc.); don't use for simple elements that are faster to build directly
- **Local-first on Day 1** — localStorage for persistence, mock data for development. No backend, no auth, no API calls
- **Modular architecture** — structured so that adding a backend, auth, or sync layer later doesn't require rewriting the UI

## Engineering Principles

- **i18n-ready from the start.** All user-facing strings go through a string map or constants file. Never hardcode display text in components. Target languages: English and Simplified Chinese.
- **Business logic lives outside components.** Components render. Hooks and utility functions compute. If a component file contains date math, filtering logic, or data transformation, move it out.
- **Type the domain early.** Define `Task`, `Event`, `Week`, and `Day` as TypeScript types in a shared `types/` directory before building UI. These types are the source of truth.
- **Mobile-first CSS.** Default styles target phone screens. Use `md:` and `lg:` breakpoints to scale up. Never write desktop-first styles and then patch mobile with overrides.
- **Theme-ready architecture.** Use CSS custom properties or Tailwind's theme layer. Design so that adding dark mode or a blue theme later is a variable swap, not a rewrite. Don't build multiple themes on Day 1.
- **No premature abstraction.** Three similar lines of code are better than a premature generic utility. Extract only when real duplication appears across multiple files.
- **Earn every dependency.** Before adding a package, ask: can I do this with native browser APIs, built-in Next.js features, or 20 lines of code? If yes, skip the package.
- **Readable names over short names.** `getTasksForDay(day)` over `getTasks(d)`. `isCurrentWeek` over `isCurr`. Code is read far more than it's written.

## Default Decision Rule

When facing any ambiguity in this project:

- **When in doubt, choose the simpler option.** Complexity must be earned by a proven need, not a hypothetical one.
- **When in doubt, prioritize the current-week workflow.** That's the product. Everything else is secondary.
- **When in doubt, reduce scope before increasing complexity.** Cut a feature before adding an abstraction layer to support it.
- **When in doubt, optimize for maintainability and user clarity.** Code that's easy to change and UI that's easy to understand will outlast clever solutions.

## Working Style

When working in this project, Claude should:

- **State the reasoning before the code.** One sentence on why before creating a file, introducing a pattern, or choosing between options.
- **Work in small, shippable phases.** Each phase should produce something that runs and can be reviewed. Never plan three steps ahead without delivering step one.
- **Build the simplest version first.** Get it working, then improve. Don't design for extensibility until there's something to extend.
- **Name tradeoffs explicitly.** "Option A is simpler but won't scale past X. Option B handles that but adds complexity. I recommend A because we're not near X yet."
- **Ship increments, not rewrites.** If improving something, change the minimum necessary. Don't refactor surrounding code unless asked.
- **Respect the folder structure.** Follow whatever patterns are established. New directories need a reason.
- **Don't expand scope silently.** If a task naturally leads to "while I'm here, I could also…" — stop and ask first.
