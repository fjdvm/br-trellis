# Agents Rules

## Tech stack
- use typescript - no any type
- use react
- use nextjs
- use tailwindcss
- use shadcn ui always
- use sqlite for now - postgres later
- use c# .net

## Code rules
- use prettier
- code files should not exceed ~250 lines, if it does, it should be split into smaller files

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





