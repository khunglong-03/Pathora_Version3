# Pathora Landing UI/UX System

Source: `ui-ux-pro-max` (`search.py --design-system`)  
Date: 2026-02-25

## Recommended Direction
- Pattern: `Scroll-Triggered Storytelling`
- Style: `Exaggerated Minimalism`
- Palette:
  - Primary `#3B82F6`
  - Secondary `#60A5FA`
  - CTA `#F97316`
  - Background `#F8FAFC`
  - Text `#1E293B`
- Typography:
  - Heading: `Outfit`
  - Body: `Work Sans`

## UX/A11y Priorities Applied
- Keyboard:
  - Added skip link (`#main-content`) from header.
  - Added stronger `focus-visible` states on key interactive controls.
- Touch:
  - Increased small tap targets to at least `44x44` where relevant.
- Performance:
  - Replaced landing `<img>` usage with `next/image`.
  - Added explicit `sizes` for responsive image loading.
- Layout:
  - Maintained explicit z-index usage for layered UI (`header`, overlays).

## Anti-patterns to Avoid
- Over-complex navigation hierarchy.
- Hidden or hard-to-reach contact actions.
- Icon-only controls without accessible labels.

## Implementation Notes
- Keep `landing-accent` as the primary CTA token to preserve current brand.
- Continue using semantic sections and explicit `aria-*` labels for navigation, dialogs, and controls.
