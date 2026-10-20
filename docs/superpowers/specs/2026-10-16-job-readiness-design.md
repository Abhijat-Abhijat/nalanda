# Job-readiness features: design

Date: 2026-10-16
Status: direction approved by the product owner ("the sole purpose of this is to make people learn and then get a job, a real job"; "please plan these all").

## Goal

Turn Nalanda from a place to learn into a place that gets learners hired: give them a direction (career paths), interview rehearsal (simulator, deck, daily problem, AI mock), proof of skill (portfolio, resume), job targeting (job description matcher), and accountability (weekly goals, application tracker).

## Users

Working engineers and career switchers preparing for software jobs, including experienced engineers (around 11 years) targeting senior or staff roles at Google, Atlassian, and similar companies.

## Features (all ten)

1. **Interview simulator**: timed rounds that mirror real loops (coding, concepts quick-fire, system design, behavioural), scored debrief, history.
2. **Career paths**: curated routes per role and level that sequence existing worlds, chapters, projects, and interview prep, with a readiness percentage and a "next step".
3. **Portfolio export**: a printable page (PDF through the browser) plus Markdown and JSON export of worlds cleared, exam scores, bosses, shipped projects, and simulator results.
4. **Resume builder**: bullets with a linter (action verb, measured result, length, no placeholders left), sections, Markdown export and print view.
5. **Job description matcher**: paste a job description; detect skills from a local taxonomy; show covered skills, gaps, and a two-week plan built from Nalanda chapters.
6. **AI mock interview**: answer a design or behavioural prompt; an LLM scores it against a rubric and gives feedback. Needs a small backend.
7. **Interview deck**: spaced-repetition flashcards of frequently asked interview questions per role.
8. **Weekly goals**: weekly targets (lessons, simulator rounds, applications) and a 12-week calendar.
9. **Application tracker**: companies, roles, stages, dates, notes, funnel statistics; stays on the device.
10. **Daily problem**: one coding exercise and one concept question per day, the same for everyone on that date.

## Decisions

- **Local first.** Features 1–5 and 7–10 run entirely in the browser with data in `localStorage`, consistent with the existing app. No accounts.
- **Separate career data store.** Career data lives under a new key `nalanda.career.v1` with its own zod schema and its own export/import, so the existing progress schema (version 1, strict) and its import flow stay untouched.
- **One navigation entry.** A single "Career" tab opens a hub (`/career`) linking every tool and the existing Projects page.
- **Reuse existing engines.** Coding rounds and the daily problem reuse `TaskRunner` and the world loaders; quiz rounds reuse `TaskRunner` for choice, order, and fill questions; the deck reuses the review intervals `[1, 3, 7, 21]` days.
- **Deterministic selection.** Simulator sessions and daily problems use a seeded PRNG, so a session can be replayed and the daily problem is the same for everyone on a date.
- **AI is optional and server-side.** The AI mock interview calls a Supabase Edge Function that holds the Anthropic API key and calls Claude (`claude-sonnet-5-5`); the browser never sees the key. Without a configured backend the feature falls back to a self-assessment rubric. Answers are not stored server-side.
- **Privacy.** Application notes and resume content never leave the device except through explicit exports or the AI feature, which shows a notice before sending.
- **Honesty.** Readiness percentages describe Nalanda coverage only and say so; the app never promises interview outcomes. Resume templates require real numbers.

## Out of scope

Accounts, cross-device sync, public profile URLs, employer-side features, payments.
