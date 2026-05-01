---
title: Tailwind Conventions
tags: [css, tailwind, components, layout, responsive]
---

# Tailwind Conventions

## 1. Affordance Classes (`ui-*`)

Element-agnostic visual patterns via `@utility` + `:where()` (zero specificity) + `@variant`.

```css
@utility ui-button {
  :where(&) {
    @apply inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold;
    @apply bg-primary text-primary-foreground shadow-sm;
    @variant hover { @apply bg-primary/90; }
    @variant focus-visible { @apply outline-2 outline-offset-2 outline-primary; }
  }
}
```

Rules: prefix `ui-`, use `@utility` (tree-shakeable), wrap in `:where()`, use `@variant` for states. Utilities still override.

## 2. `cn()` for className Merging — CRITICAL

Always merge classNames via `cn()` from `~/lib/cn`. Built on `clsx` + `tailwind-merge`.

```tsx
import { cn } from "~/lib/cn";

function Button({ className, variant, size, disabled }: Props) {
  return (
    <button className={cn(
      "inline-flex items-center justify-center rounded-lg font-medium",
      { "bg-teal-500 text-white": variant === "primary",
        "bg-neutral-100 text-neutral-900": variant === "secondary" },
      { "px-3 py-1.5 text-sm": size === "sm",
        "px-4 py-2 text-base": size === "md" },
      disabled && "opacity-50 cursor-not-allowed",
      className, // ALWAYS LAST so consumer overrides win
    )} />
  );
}
```

Conditional forms: object (preferred), `cond && "cls"`, ternary. `cn()` ignores `undefined`/`null`/`false`.

Anti-patterns: template literal concat, `className` not last, raw static string only.

## 3. className Prop Types

```tsx
import type { ClassName, ClassNameRecord } from "~/lib/cn";

// Single element
type Props = { className?: ClassName };

// Multi-part component
type Props = { className?: ClassNameRecord<"root" | "label" | "input" | "error"> };

<TextField className={{ root: "w-full", input: "border-failure-500" }} />
```

| Scenario | Type |
|---|---|
| Single wrapper | `ClassName` |
| Internal structure | `ClassNameRecord<...>` |
| Forward to child | match child's type |

## 4. Color Schemes (light / dark / system)

Custom `dark` variant supporting `.dark` and `.system` classes:

```css
@custom-variant dark {
  &:where(.dark *, .dark) { @slot; }
  &:where(.system *, .system) {
    @media (prefers-color-scheme: dark) { @slot; }
  }
}
```

Apply `light` / `dark` / `system` on root element.

## 5. Stack Layout Utilities — CRITICAL

Use stack utilities, not raw flex.

| Class | Equivalent |
|---|---|
| `v-stack` | `flex flex-col` |
| `h-stack` | `flex flex-row` |
| `v-stack-reverse` / `h-stack-reverse` | reversed |
| `z-stack` | grid overlay (children share `1/1/1/2`) |
| `center` | `flex items-center justify-center` |
| `spacer` | `flex-1` |
| `circle` | `aspect-square rounded-full shrink-0` |

```css
@utility v-stack { display: flex; flex-direction: column; }
@utility h-stack { display: flex; flex-direction: row; }
@utility z-stack {
  display: grid; align-items: center; justify-items: center;
  & > * { grid-area: 1 / 1 / 1 / 2; }
}
@utility center { display: flex; justify-content: center; align-items: center; }
@utility spacer { flex: 1 1 auto; }
@utility circle { aspect-ratio: 1 / 1; border-radius: 9999px; flex-shrink: 0; }
```

```tsx
<div className="v-stack gap-4">
  <header className="h-stack items-center justify-between">…</header>
  <main className="spacer">…</main>
</div>

// z-stack overlay
<div className="z-stack">
  <img src={avatar} className="size-12 circle" />
  <div className="size-3 circle bg-success-500 self-end justify-self-end" />
</div>
```

## 6. Responsive Breakpoints (mobile-first)

| Prefix | Min |
|---|---|
| `sm:` | 640px |
| `md:` | 768px |
| `lg:` | 1024px |
| `xl:` | 1280px |
| `2xl:` | 1536px |

```tsx
// Stack on mobile, row on desktop
<div className="v-stack lg:h-stack gap-4">
  <main className="grow min-w-0">…</main>
  <aside className="shrink-0 lg:w-80">…</aside>
</div>

// Show/hide
<nav className="hidden lg:flex h-stack gap-4" />
<button className="lg:hidden"><MenuIcon /></button>

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" />
```

Reverse on breakpoint: `v-stack lg:h-stack-reverse`.

## 7. Capability over Device Labels

Target input/hover, not "mobile vs desktop".

```tsx
// Bigger touch targets
<button className="h-10 w-10 pointer-coarse:h-12 pointer-coarse:w-12" />

// Hover only when supported
<button className="bg-gray-900 hover:bg-gray-800" />
```

Rules: avoid mobile/desktop assumptions, use `pointer-coarse`/`pointer-fine`, hover behind hover-capable variants, breakpoints = layout clusters.

## 8. Responsive Typography

```tsx
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold" />
<p className="text-sm md:text-base lg:text-lg leading-relaxed" />
```

| Class | px | Use |
|---|---|---|
| `text-xs` | 12 | captions |
| `text-sm` | 14 | secondary, mobile body |
| `text-base` | 16 | body |
| `text-lg` | 18 | large body / subheadings |
| `text-xl` | 20 | small heading |
| `text-2xl` | 24 | section heading |
| `text-3xl` | 30 | page heading |
| `text-4xl` | 36 | hero |

Truncation: `truncate` (single line), `line-clamp-N` (multi-line).

Anti-patterns: hardcoded `style={{ fontSize }}`, 4+ breakpoint steps. Cap 2–3 steps.
