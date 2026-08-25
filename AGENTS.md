# Agents Rules

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




