# Pathora Homepage — Bold & Immersive Redesign

**Date:** 2026-03-23
**Scope:** Landing page (home) only
**Status:** Approved

---

## 1. Concept & Vision

Transform the Pathora landing page from warm minimalist to **dark-first, cinematic, immersive**. The page should feel like stepping into a premium travel experience — bold typography, vibrant accent colors floating over deep dark backgrounds, 3D illustration visuals, and high-impact scroll animations. Every scroll reveals a new "frame" with depth and motion.

**Mood:** Premium, adventurous, modern, cinematic.

---

## 2. Design Language

### Color Palette

| Role | Color | Hex |
|------|-------|-----|
| Primary Background | Deep Dark | `#0a0a1a` |
| Deepest Background | Near Black | `#050510` |
| Card Dark | Dark Gray | `#111827` |
| Primary Accent | Electric Orange | `#fb8b02` |
| Secondary Accent | Electric Blue | `#3b82f6` |
| Tertiary Accent | Vibrant Pink | `#ec4899` |
| Text Primary | White | `#ffffff` |
| Text Secondary | Muted White | `rgba(255,255,255,0.6)` |
| Text Muted | Faded White | `rgba(255,255,255,0.4)` |

### Typography

- **Display Font:** Space Grotesk (Google Fonts) — headlines, hero text, section titles
- **Body Font:** Inter (Google Fonts) — paragraphs, UI labels, descriptions
- **Fallback:** `system-ui, sans-serif`

**Scale:**
- Hero headline: `clamp(2.5rem, 6vw, 5rem)`, 700 weight, tight letter-spacing
- Section titles: `clamp(1.75rem, 4vw, 3rem)`, 700 weight
- Body: `1rem`, 400 weight, `1.65` line-height
- Captions: `0.875rem`, secondary text color

### Border Radius

- Cards: `16px`
- Large sections: `24px`
- Buttons: `9999px` (pill/rounded-full)
- Inputs: `12px`

### Shadows

- Card shadow: `0 8px 32px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)`
- Glow (accent): `0 0 20px rgba(251,139,2,0.3)`
- Soft floating: `0 20px 60px rgba(0,0,0,0.4)`

### Motion Philosophy

- **Scroll-triggered animations:** Elements fade in + slide up on viewport entry
- **Parallax:** Hero video + floating orbs have subtle parallax on scroll
- **3D Tilt:** Cards tilt on hover (mouse-following perspective)
- **Count-up:** Stats animate from 0 to value when scrolled into view
- **Micro-interactions:** Buttons scale + glow on hover, icons animate
- **Easing:** `cubic-bezier(0.32,0.72,0,1)` for smooth, premium feel
- **Duration:** 300-600ms for transitions, 1-2s for entrance animations

---

## 3. Page Structure

```
[Navbar — transparent, sticky, blur on scroll]
│
├── HERO SECTION (100vh)
│   ├── Video background (loop, muted, autoplay)
│   ├── Gradient overlay
│   ├── Floating gradient orbs (3x: orange, blue, pink)
│   ├── Headline: "Explore Vietnam's Hidden Gems"
│   ├── Subheadline
│   ├── Search bar (destination + date + Explore button)
│   └── Scroll indicator (animated chevron)
│
├── STATS STRIP
│   └── 4 key numbers: 1200+ Tours | 50K+ Travelers | 4.9★ | 24/7 Support
│       (count-up animation on scroll)
│
├── TRENDING DESTINATIONS
│   └── Horizontal scroll carousel (4-5 cards, snap points)
│       • Hanoi, HCMC, Da Nang, Hue, Mekong Delta
│       • 3D tilt on hover, glassmorphism overlay
│
├── VIDEO SHOWCASE (NEW)
│   └── Full-width cinematic video
│       • Play button (glassmorphism) → expands to fullscreen
│       • Gradient backdrop: pink → blue → orange
│       • Centered text: "Vietnam Awaits"
│
├── FEATURED ADVENTURES (Bento Grid)
│   └── Asymmetric grid (large + medium + wide cards)
│       • 3D tilt on hover
│       • Price badge (top-right orange pill)
│       • CTA reveal on hover
│
├── LATEST TOURS
│   └── Horizontal scroll (compact cards)
│       • Image + name + price + "View" link
│       • Slide-up description on hover
│
├── WHY CHOOSE US
│   └── 4-column icon grid
│       • Best Price Guarantee, Expert Local Guides, 24/7 Support, Flexible Booking
│       • Animated icons on hover
│
├── CTA SECTION
│   └── Gradient background (orange → pink → blue)
│       • Headline: "Ready for Your Next Adventure?"
│       • Large CTA button (dark bg, white text)
│       └── Subtle particle animation in background
│
├── REVIEWS
│   └── Auto-play carousel (pauses on hover)
│       • Avatar + name + location + 5 stars + quote
│       • Glassmorphism cards
│
└── FOOTER
    └── 4 columns: Logo+tagline | Quick Links | Destinations | Contact
        • Social icons (accent colors)
        └── Newsletter input
```

---

## 4. Component Specifications

### Navbar
- Transparent background over hero
- On scroll: `backdrop-blur(12px)` + subtle border-bottom
- Logo: Pathora text (Space Grotesk, white)
- Links: Home, Destinations, Tours, About, Contact
- CTA button: "Book Now" (orange pill)
- Mobile: hamburger menu with slide-in drawer

### Hero Video Background
- Source: High-quality travel video (placeholder: Unsplash video or local asset)
- Attributes: `autoplay muted loop playsInline`
- Overlay: `linear-gradient(135deg, rgba(10,10,26,0.7), rgba(26,10,46,0.6))`
- Aspect: cover, centered

### Floating Orbs (Hero)
- 3 gradient orbs, each ~100-150px
- Animation: floating up/down (translateY), subtle scale pulse
- Colors: orange (#fb8b02), blue (#3b82f6), pink (#ec4899)
- Blur: `filter: blur(60px)` for soft glow effect
- Z-index: behind content

### Search Bar
- Container: glassmorphism (`backdrop-blur(16px)`, semi-transparent dark)
- Inputs: destination (text), date range (date picker)
- Button: "Explore" — orange gradient, pill shape
- Layout: horizontal row on desktop, stacked on mobile

### Destination Cards
- Size: `280px × 360px` (desktop)
- Image: 3D illustration or stylized photo with gradient overlay
- Content: destination name (bottom-left overlay)
- Hover: 3D tilt (5-10deg), scale(1.03), glow border, glassmorphism overlay
- Transition: 300ms ease

### Tour Cards (Featured — Bento)
- Large card: `580px × 420px`
- Medium cards: `280px × 420px` each
- Elements: background image/illustration, gradient overlay, badge (price, top-right), tour name, duration, rating stars
- Hover: 3D tilt, CTA button slides up from bottom

### Video Showcase
- Aspect: 16:9 or cinematic (21:9)
- Play button: 80px glassmorphism circle, centered
- Expand: click → fullscreen overlay modal
- Background gradient: `linear-gradient(135deg, rgba(236,72,153,0.2), rgba(59,130,246,0.2), rgba(251,139,2,0.2))`

### Stats Strip
- Background: `rgba(251,139,2,0.08)`, border `rgba(251,139,2,0.15)`
- Numbers: Space Grotesk, bold, orange accent
- Labels: secondary text, uppercase, small
- Animation: count-up from 0 on viewport entry (Intersection Observer)

### Why Choose Us Grid
- Layout: 4 columns, gap 24px
- Icon: 48px, animated bounce/rotate on hover
- Title: bold, white
- Description: secondary text, 2 lines max

### CTA Section
- Background: gradient `linear-gradient(135deg, #fb8b02, #ec4899, #3b82f6)`
- Headline: white, large, bold
- Button: dark bg (`#111827`), white text, pill, hover glow
- Particle effect: subtle floating dots (CSS animation)

### Review Cards
- Background: glassmorphism (`backdrop-blur(12px)`, dark translucent)
- Border: `1px solid rgba(255,255,255,0.1)`
- Avatar: 48px circle
- Stars: orange fill
- Quote: italic, secondary text

### Footer
- Background: `#050510`
- Columns: 4 on desktop, 2 on tablet, stacked on mobile
- Social icons: 24px, accent color on hover
- Newsletter: dark input + orange submit button
- Bottom: copyright, subtle divider

---

## 5. Technical Approach

### Stack
- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4 (existing)
- **Animations:** Framer Motion (existing) + CSS animations for simple effects
- **Icons:** Phosphor Icons (existing)
- **Fonts:** Google Fonts (Space Grotesk + Inter)

### Implementation Strategy
1. Add new design tokens to `globals.css` (CSS variables for dark theme)
2. Update Tailwind config with new color palette
3. Create new component: `features/home/components/BoldHeroSection.tsx`
4. Refactor existing sections or create new counterparts:
   - `BoldTrendingDestinations.tsx`
   - `BoldVideoShowcase.tsx`
   - `BoldFeaturedTrips.tsx` (bento grid)
   - `BoldLatestTours.tsx`
   - `BoldWhyChooseUs.tsx`
   - `BoldCtaSection.tsx`
   - `BoldReviewsSection.tsx`
   - `BoldFooter.tsx`
5. Add scroll-triggered animations via Framer Motion `useInView`
6. Add 3D tilt effect via custom hook or library
7. Dark mode toggle or permanent dark theme (no light mode for landing)

### Performance
- Video: lazy load below fold, preload hero
- Images: Next.js Image with priority for above-fold
- Animations: `will-change` + `transform` for GPU acceleration
- Fonts: `display=swap`, preload critical fonts

### Responsive Breakpoints
- Mobile: `< 640px` — stacked layout, full-width cards
- Tablet: `640px - 1024px` — 2-column grids
- Desktop: `> 1024px` — full bento grid, horizontal scrolls

---

## 6. Sections Summary

| # | Section | Layout | Key Interaction |
|---|---------|--------|----------------|
| 1 | Hero | 100vh, video bg | Floating orbs, parallax, search bar |
| 2 | Stats Strip | Horizontal bar | Count-up animation |
| 3 | Trending Destinations | Horizontal scroll | 3D tilt, glassmorphism hover |
| 4 | Video Showcase | Full-width | Play/expand video |
| 5 | Featured Adventures | Bento grid | 3D tilt, CTA reveal |
| 6 | Latest Tours | Horizontal scroll | Slide-up description |
| 7 | Why Choose Us | 4-column grid | Icon animation |
| 8 | CTA | Full-width gradient | Particle background |
| 9 | Reviews | Carousel | Auto-play, glassmorphism |
| 10 | Footer | 4-column | Newsletter input |

---

## 7. Out of Scope

- Admin dashboard pages
- Tour detail, checkout, booking pages
- Authentication pages
- Dark mode toggle (landing is dark-only)
- Backend changes
