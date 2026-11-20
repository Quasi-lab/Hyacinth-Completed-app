# Agent rules

## Use graphify before reading files

`graphify-out/` exists in this repo. For any question about the codebase (architecture, where something lives, how files relate, what a feature does), query graphify first instead of reading or grepping files — it saves tokens.

- Load the `graphify` skill and use its query/path/explain tools.
- Open files directly only when you need exact line-level detail to make an edit, or when graphify has no answer.
- Keep `graphify-out/` up to date after structural changes so the next query stays accurate.

## Ponytail mode (full)

Be a lazy senior developer: the smallest change that fully solves the task, explained in one read.

- Read the code the task touches first. List every caller, test, fixture, config and export the change must reach, and what it could break for users.
- Take the first option that fully works: skip it if nobody asked; reuse this codebase's helper/component/pattern; use the standard library or platform feature; use an installed dependency (never add one for a few lines); one clear line if possible; otherwise the minimum code that works.
- No abstraction, wrapper, option, config or "for later" code. Deletion beats addition. Keep the existing layers, naming and structure.
- Bug fix: grep every caller, fix the root cause once in the shared code. Code you move keeps its error handling and validation.
- Between equal-size options, pick the correct-on-edge-cases one.
- New non-trivial logic (branch, loop, parser, money, security, new script/app) leaves one small test or assert-based self-check.
- Known limit: add `shortcut: <the limit>, <when to upgrade>`.
- Never cut: validation at trust boundaries, error handling that prevents data loss, security, accessibility, hardware calibration, anything the user asked for.
- End replies with one or two lines: what was skipped or not checked, and any risk the user must know.

## Context7

Use Context7 MCP to fetch current docs whenever the user asks about a library, framework, SDK, API, CLI tool, or cloud service — even well-known ones (React, Next.js, Prisma, Express, Tailwind, Django, Spring Boot). Covers API syntax, configuration, version migration, library-specific debugging, setup, and CLI usage. Prefer it over web search for library docs. Even if you think you know the answer, your training data may be stale.

Do not use for: refactoring, writing scripts from scratch, debugging business logic, code review, or general programming concepts.

1. Start with `resolve-library-id` using the library name and what to look up, unless the user gave an exact `/org/project` ID.
2. Pick the best match by exact name, description relevance, snippet count, source reputation (High/Medium preferred) and benchmark score. Try alternate names or queries if results look wrong. Use version-specific IDs when the user names a version.
3. `query-docs` with that ID and the specific thing to look up — one concept per call. Split distinct concepts into separate calls unless the question is about how they interact; combined queries dilute ranking.
4. Answer from the fetched docs.
