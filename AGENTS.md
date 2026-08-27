# Agents Rules

---

## 1. Conventions

- Check the PRD and verify what's already done before starting work.
- Use GitHub conventions for branch naming (`feature/`, `bug/`, `chore/`, etc.).
- Use GitHub conventions for commits (`feat:`, `fix:`, `chore:`, etc.).
- Use GitHub conventions for PRs and issues.
- No need to create a new branch — push directly to main.
- When implementing a feature, creating a spec, or tickets: always include schema, API, and UI changes together.
- Always migrate the database in `api-crm` when touching/modifying schema that relates to it.
- Follow tracer bullets, SOLID principles, and the rest of these rules.
- Always create seed data for every new feature.
- After implementing each issue, close it and create a test issue for that feature.
- Always add github-actions[bot] as contributor: include `Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>` in every commit message.
- Always commit after each task is done.

---

## 2. Tech Stack

- TypeScript — no `any` type
- React
- Next.js
- Tailwind CSS
- shadcn/ui (always)
- SQLite for now — Postgres later
- C# .NET
- EF Core

---

## 3. Code Rules

- Use Prettier for formatting.
- Code files should not exceed ~300 lines. If it does, split into smaller files.
- For frontend, always look at the `.design-ref/` directory for designs. Strictly follow the layout, but for themes and UI, use what we have.
- Don't change the header and sidebar.
- The `.design-ref/` directory is just a basis for layout and designs.
- Issues and requirements are the source of truth; designs are just a guideline.
- Always normalize data on input and format consistently on output:
  - **Input (backend):** Trim whitespace from all string fields. Lowercase emails. Normalize phone numbers to a consistent format. Apply normalization in Services or Validators before persisting.
  - **Input (frontend):** Trim form field values before submitting to the API.
  - **Output (display):** Format currency with 2 decimal places and `$` prefix. Format dates consistently (e.g., `toLocaleDateString()`). Display names with proper casing (use `formatName()` from `lib/format-display.ts` to title-case all person and company names). Display emails in lowercase (use `formatEmail()` from `lib/format-display.ts`). Show `"—"` for null/empty values.

---

## 4. UI / Styling Rules

- Use `text-base` (not `text-sm`) as the default text size inside tables and detail page containers across all pages.
- Only use `text-sm` for secondary/metadata text (e.g., timestamps, line item details). Never use `text-xs` for primary content.
- Keep font sizes consistent across all pages — if a table or container card uses `text-base` in one page, all pages should match.
- Every table column must have a `min-w-[Xpx]` class on its `<TableHead>` to prevent content from overlapping on mobile screens. Do not use `table-fixed` with percentage widths — let columns expand naturally and rely on the shared Table component's `overflow-auto` wrapper for horizontal scrolling.
- Wrap all tables and long-content containers in a scrollable wrapper (`max-h-[600px] overflow-y-auto border border-border rounded-lg`) instead of letting them expand the page infinitely. Use sticky headers (`sticky top-0 bg-background z-10` on `<TableHeader>`) so column labels remain visible while scrolling.
- Every table/list row that represents an entity with a detail page must have full-row click navigation (`cursor-pointer hover:bg-muted/50` on `<TableRow>` with `onClick={() => router.push(...)}`). Don't limit navigation to just the name column — the entire row should be clickable.

---

## 5. Next.js Pages

Pages should only contain minimal code — delegate to feature components:

```tsx
export default function Page() {
  return <HelloWorld />
}
```

---

## 6. Next.js Components

- Feature component contents go in `components/features/hello-world.tsx`.
- Always use `shadcn/ui` — install components as needed.

---

## 7. Separation of Concerns (Backend)

These rules define what belongs in each folder and how layers may depend on
each other. Follow them when adding or modifying code so responsibilities
stay isolated and testable.

### Dependency direction (top depends on bottom, never reverse)

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

### Folder responsibilities

#### `Controllers/`
- HTTP concerns only: routing, model binding, status codes, `[Authorize]`.
- No business logic, no direct `DbContext` or repository calls.
- Talks only to `Services` via their `Interfaces`.
- Accepts/returns `DTOs` — never exposes `Models` (EF entities) directly.
- Keep methods thin: validate input shape → call service → map result → return.

#### `Services/`
- All business logic and orchestration lives here.
- Depends on `Repositories` (via `Interfaces`), never on `DbContext` directly.
- Uses `Validators` to check business rules, `Mappers` to convert `Models` ↔ `DTOs`.
- One interface per service in `Interfaces/`, implementation here.
- Should be unit-testable without a database (mock the repository interface).

#### `Repositories/`
- Data access only: queries, inserts, updates, deletes via `Data`'s `DbContext`.
- No business rules, no DTO mapping, no HTTP awareness.
- Returns `Models` (entities) or primitives — never `DTOs`.
- One interface per repository in `Interfaces/`.

#### `Data/`
- `DbContext`, entity configurations (`IEntityTypeConfiguration<T>`), migrations, seed data.
- No logic beyond persistence concerns (constraints, indexes, relationships).

#### `Models/`
- Plain domain/EF entities. Properties and navigation only.
- No dependencies on any other folder — must compile standalone.

#### `DTOs/`
- Shapes used at the API boundary (request/response contracts).
- No behavior, no EF annotations, no references to `Models`.

#### `Mappers/`
- Pure `Model ↔ DTO` conversion functions (or AutoMapper profiles).
- No business logic, no I/O.

#### `Validators/`
- Input/business-rule validation (e.g., FluentValidation validators).
- Validates `DTOs` on the way in; does not touch `Models` or the database.

#### `Interfaces/`
- Contracts for `Services` and `Repositories` (`IXxxService`, `IXxxRepository`).
- Controllers and Services depend on these, not on concrete classes — keeps layers swappable and mockable.

#### `Enums/`
- Shared enumerations only. No logic.

#### `Configurations/`
- DI registration (`AddScoped`, `AddSingleton`, etc.), `IOptions<T>` classes, middleware setup.
- Wired up from `Program.cs`.

#### `Helpers/`
- Small, stateless, generic utilities (e.g., string/date helpers).
- Must not contain business rules — if a helper touches business logic, it belongs in `Services` instead.

#### `Program.cs`
- App bootstrap and middleware pipeline only. Delegates DI setup to `Configurations/`.

### Enforcement rules

1. **Never** let a `Controller` call a `Repository` or `DbContext` directly.
2. **Never** let a `Repository` or `Model` reference a `DTO`, `Service`, or `Controller`.
3. **Always** introduce/extend an `Interfaces/` contract when adding a new `Service` or `Repository` — don't inject concrete classes.
4. **Always** map `Model → DTO` (and back) through `Mappers/`, not inline in `Controllers` or `Services`.
5. **Always** put new validation in `Validators/`, not inside `Controllers` or `Services`.
6. If a class needs to do two things from different layers (e.g., validate *and* query the database), split it — don't merge responsibilities into one file to save time.
7. When unsure where new code belongs, ask: "Is this HTTP shape (Controller), business rule (Service/Validator), data shape (DTO/Mapper), or data access (Repository/Data)?" — place it there, not in `Helpers/` as a catch-all.

---

## 8. Agent Skills

### Issue tracker

Issues and specs live as GitHub issues managed via `gh`. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical triage roles mapped 1-to-1 to repo labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo using `CONTEXT.md` and `docs/adr/`. See `docs/agents/domain.md`.
