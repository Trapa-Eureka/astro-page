# WORKFLOW — the AI-native rules for running this repo

Based on: Clare Liguori (AWS), "From AI-Assisted to AI-Native: Building a Frontier Development Team"
(https://youtu.be/Ry0WHNxDbYA · AWS blog: https://aws.amazon.com/blogs/machine-learning/how-frontier-teams-are-reinventing-ai-native-development/)
The operating principles are the same as in the previous five repos. What follows is the shared summary plus **what's specific to this repo**.

## 0. Role definition (the three frontier behaviors)

| Behavior | In this repo |
|---|---|
| Hands-off Coding (1–2%) | Jin only edits SPEC/DESIGN, does visual review, runs the Keystatic smoke test, and makes the evaluation call |
| Infrequent Interaction | Every task has machine-decidable acceptance criteria (check + verify) → it runs to completion with no mid-session intervention |
| Minimized Idle Time | Lanes A–D run in parallel after T2. The backlogs of all six repos are run as a single worktree queue |

## 1. The 5 habits → rules (shared summary)

1. **Agent Context** — missing knowledge goes in CLAUDE.md/docs and nowhere else. Biweekly pruning plus a log.
2. **Slow Down to Speed Up** — this repo's up-front investment is funneling content policy (sorting, draft exclusion) into the single `publishedPosts` function, and making the schema not a duplicated pair but "a single source of truth held together by a parity test."
3. **Feed, Don't Babysit** — assignment is one pass of the TASKS template; self-verification is `npm run check` (+ verify from T7 onward).
   ```bash
   git worktree add ../astro-test-t4 -b t4 && cd ../astro-test-t4 && claude
   ```
4. **Explicit Intent** — changes to the content model, routes, or verify rules land as a DESIGN/TESTING diff before any code.
5. **Shift Left** — translated for a static site: **checking the build output (dist) is the local deterministic mock**. Links, metadata, and policy all get machine-judged without a browser or a live deploy, and only visual quality is left for human review.

## 2. astro-test specifics

- **Reference-copyright discipline**: any Guardian text, typeface, or logo that leaks into the code, content, or assets is an immediate rejection. The forbidden-string scan in verify is only a safety net; review is the first line of defense. Borrowing goes no further than the "layout grammar" list in SPEC §2 — when in doubt, don't borrow.
- **Content is an artifact too**: the seed posts are fiction, but they are treated as fixtures with edge cases baked in (draft, multi-author, with/without cover). If a content edit breaks a test, don't just fix the content — decide in the docs which side is the source of truth.
- **No relaxing verify**: a change that passes by deleting a checklist item or loosening a threshold is rejected. The correct response to a failure is to fix the site.
- **Visual judgment is human-only**: agents implement up to the tokens.css defaults and no further. Typography, spacing, and color adjustments happen in the smoke review as token value changes — never by adding a library or restructuring.
- **Identity as an evaluation project**: when feature appetite kicks in (search, dark mode), it goes to the backlog on hold — what "done" means for this repo is EVAL-KEYSTATIC.md.

## 3. Daily operating routine

1. Identify which tasks are ready to start → assign a worktree per lane (shared queue across the six repos)
2. Don't intervene while a task is running — use that time to refine seed content topics and the items in the evaluation memo
3. Completion report → re-run check (+ verify) → review the diff → merge → update status
4. Biweekly: prune CLAUDE.md, tidy up TASKS

## 4. The autonomy line (what humans own)

- Visual review, final typography choices, locking in token values
- Running the Keystatic editing smoke test and the final call in the evaluation memo (whether to adopt it in production)
- The decision to replace the (placeholder) company name
- Whether to actually deploy (Vercel)
- Whether to flip the GitHub repo (Trapa-Eureka/astro-page) visibility from private to public
