# Agents Rules

## Conventions
- check the PRD and add check what's already done
- use github conventions for naming (feature/bug/chore/etc)
- use github conventions for commits (feat: add new feature, fix: fix bug, etc)
- use github conventions for PRs (feat: add new feature, fix: fix bug, etc)
- use github conventions for issues (feat: add new feature, fix: fix bug, etc)
- no need to create a new branch, push directly to main
- should be doing schema, api, and ui changes when implementing a feature, when creating a spec, or tickets
- always migrate database in api-crm when touching/modifying the schema, etc. that relates to the api-crm
- make sure you are following tracer bullets, SOLID principles, and the rest of the rules

## Tech stack
- use typescript - no any type
- use react
- use nextjs
- use tailwindcss
- use shadcn ui always
- use sqlite for now - postgres later
- use c# .net
- use EF Core

## Code rules
- use prettier
- code files should not exceed ~250 lines, if it does, it should be split into smaller files
- for fronend, always look at the .design-ref/ directory for the designs. strictly follow the layout, but for the themes and ui, use what we have.
- don't change the header and sidebar
- the .design-ref/ directory is just a basis for layout and designs.
- the issues and requirements are still the source of truth, but the designs are just a guideline.

## Nextjs Pages
pages in nextjs should only have this kinds of codes:

```js
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Page() {
  return <HelloWorld />
}
```

## Nextjs Components

- HelloWorld contents should be in components/features/hello-world.tsx
- always use shadcn ui install if needed

## Agent skills

### Issue tracker

Issues and specs live as GitHub issues managed via `gh`. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical triage roles mapped 1-to-1 to repo labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo using `CONTEXT.md` and `docs/adr/`. See `docs/agents/domain.md`.




# Separation of Concerns — Project Rules

These rules define what belongs in each folder and how layers may depend on
each other. Follow them when adding or modifying code so responsibilities
stay isolated and testable.

## Dependency direction (top depends on bottom, never reverse)

```
Controllers
    ↓
Services  ←→  Validators / Mappers
    ↓
Repositories
    ↓
Data (DbContext)
    ↓
Models
```

`Interfaces`, `DTOs`, and `Enums` are cross-cutting and can be referenced by
any layer above `Data`. Nothing in `Models` or `Data` may reference
`Controllers`, `Services`, or `DTOs`.

## Folder responsibilities

### `Controllers/`
- HTTP concerns only: routing, model binding, status codes, `[Authorize]`.
- No business logic, no direct `DbContext` or repository calls.
- Talks only to `Services` via their `Interfaces`.
- Accepts/returns `DTOs` — never exposes `Models` (EF entities) directly.
- Keep methods thin: validate input shape → call service → map result → return.

### `Services/`
- All business logic and orchestration lives here.
- Depends on `Repositories` (via `Interfaces`), never on `DbContext` directly.
- Uses `Validators` to check business rules, `Mappers` to convert
  `Models` ↔ `DTOs`.
- One interface per service in `Interfaces/`, implementation here.
- Should be unit-testable without a database (mock the repository interface).

### `Repositories/`
- Data access only: queries, inserts, updates, deletes via `Data`'s
  `DbContext`.
- No business rules, no DTO mapping, no HTTP awareness.
- Returns `Models` (entities) or primitives — never `DTOs`.
- One interface per repository in `Interfaces/`.

### `Data/`
- `DbContext`, entity configurations (`IEntityTypeConfiguration<T>`),
  migrations, seed data.
- No logic beyond persistence concerns (constraints, indexes, relationships).

### `Models/`
- Plain domain/EF entities. Properties and navigation only.
- No dependencies on any other folder — must compile standalone.

### `DTOs/`
- Shapes used at the API boundary (request/response contracts).
- No behavior, no EF annotations, no references to `Models`.

### `Mappers/`
- Pure `Model ↔ DTO` conversion functions (or AutoMapper profiles).
- No business logic, no I/O.

### `Validators/`
- Input/business-rule validation (e.g., FluentValidation validators).
- Validates `DTOs` on the way in; does not touch `Models` or the database.

### `Interfaces/`
- Contracts for `Services` and `Repositories` (`IXxxService`, `IXxxRepository`).
- Controllers and Services depend on these, not on concrete classes —
  keeps layers swappable and mockable.

### `Enums/`
- Shared enumerations only. No logic.

### `Configurations/`
- DI registration (`AddScoped`, `AddSingleton`, etc.), `IOptions<T>` classes,
  middleware setup. Wired up from `Program.cs`.

### `Helpers/`
- Small, stateless, generic utilities (e.g., string/date helpers).
- Must not contain business rules — if a helper touches business logic,
  it belongs in `Services` instead.

### `Program.cs`
- App bootstrap and middleware pipeline only. Delegates DI setup to
  `Configurations/`.

## Enforcement rules for the AI

1. **Never** let a `Controller` call a `Repository` or `DbContext` directly.
2. **Never** let a `Repository` or `Model` reference a `DTO`, `Service`, or
   `Controller`.
3. **Always** introduce/extend an `Interfaces/` contract when adding a new
   `Service` or `Repository` — don't inject concrete classes.
4. **Always** map `Model → DTO` (and back) through `Mappers/`, not inline in
   `Controllers` or `Services`.
5. **Always** put new validation in `Validators/`, not inside `Controllers`
   or `Services`.
6. If a class needs to do two things from different layers (e.g., validate
   *and* query the database), split it — don't merge responsibilities into
   one file to save time.
7. When unsure where new code belongs, ask: "Is this HTTP shape (Controller),
   business rule (Service/Validator), data shape (DTO/Mapper), or data
   access (Repository/Data)?" — place it there, not in `Helpers/` as a
   catch-all.
