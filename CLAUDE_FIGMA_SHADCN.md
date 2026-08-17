# CLAUDE.md — Figma → Custom Design System → shadcn/ui

## Goal

The goal of this project is to translate custom Figma designs into production-ready React UI while keeping the codebase visually consistent, reusable, and maintainable.

Use **Figma as the design source**, **design tokens as the visual language**, **shadcn/ui as a behavior/accessibility foundation where useful**, and the project's own `components/ui` as the primary UI source of truth.

Do **not** treat Figma as a source for one-off JSX/CSS exports.

---

## Core Principle

The preferred architecture is:

```text
Figma
  ↓
Design tokens / variables
  ↓
Custom UI design system
  ↓
shadcn/ui primitives where useful
  ↓
Product components
  ↓
Application screens
```

The resulting application should look like the custom Figma design, **not like default shadcn/ui**.

shadcn/ui is primarily used for:

- behavior
- accessibility
- keyboard interactions
- focus management
- reusable primitives
- complex interactive states

Its default visual styling may be modified or replaced.

---

## Source of Truth

Use this priority order when implementing UI:

1. Existing project components in `components/ui`
2. Existing project design tokens
3. Existing product/layout components
4. Figma component variants and properties
5. shadcn/ui primitives
6. New custom implementation only when no suitable reusable component exists

Never create a new low-level UI primitive if an equivalent already exists in the project.

---

## Design Tokens

Prefer semantic design tokens over hardcoded values.

Examples:

```text
color/background
color/surface
color/surface-hover
color/text
color/text-muted
color/brand
color/brand-hover

radius/sm
radius/md
radius/lg

space/1
space/2
space/3
space/4

shadow/sm
shadow/md
```

In code, prefer variables or theme utilities such as:

```css
:root {
  --background: ...;
  --surface: ...;

  --foreground: ...;
  --muted-foreground: ...;

  --primary: ...;
  --primary-hover: ...;

  --radius-sm: ...;
  --radius-md: ...;
  --radius-lg: ...;
}
```

Prefer:

```tsx
className="rounded-md bg-primary px-4"
```

over:

```tsx
className="rounded-[13px] bg-[#625BF6] px-[17px]"
```

Do not hardcode colors, spacing, radii, typography, or shadows when an equivalent project token exists.

---

## Figma Components → React Components

Figma component structure should map conceptually to React props.

Example Figma component:

```text
Button

Variant:
- Primary
- Secondary
- Ghost
- Destructive

Size:
- sm
- md
- lg

Icon:
- none
- left
- right
```

Preferred React API:

```tsx
<Button variant="primary" size="lg">
  Continue
</Button>
```

Do not generate a new styled `<button>` every time the Figma design contains a button.

Reuse the existing project `Button`.

---

## Component Architecture

Preferred structure:

```text
components/
├── ui/
│   ├── button.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   ├── select.tsx
│   ├── card.tsx
│   └── badge.tsx
│
├── product/
│   ├── user-card.tsx
│   ├── pricing-card.tsx
│   ├── project-card.tsx
│   └── dashboard-widget.tsx
│
└── layout/
    ├── sidebar.tsx
    ├── navbar.tsx
    └── page-container.tsx
```

### `components/ui`

Contains reusable low-level components that represent the project's design system.

These may internally use shadcn/ui or Radix primitives, but visually must match the custom design system.

### `components/product`

Contains domain-specific components composed from `components/ui`.

Examples:

- PricingCard
- UserCard
- ProjectCard
- AnalyticsWidget

### `components/layout`

Contains structural reusable layout components.

Examples:

- Sidebar
- Navbar
- PageContainer
- Header
- Shell

---

## How to Use shadcn/ui

Use shadcn/ui when it provides useful interaction logic or accessibility.

Good candidates include:

- Dialog
- Popover
- Dropdown Menu
- Select
- Command
- Tabs
- Tooltip
- Accordion
- Sheet
- Drawer
- Form controls
- Calendar
- Context Menu

Do not preserve default shadcn visuals unless they match the Figma design.

Customize:

- colors
- typography
- radius
- spacing
- borders
- shadows
- hover states
- focus states
- animation
- sizing
- icons
- internal layout

Think of shadcn/ui as a starting point for behavior, not as the final visual identity.

---

## Figma → Code Workflow

When implementing a Figma design:

### 1. Inspect existing code first

Before writing new UI:

- inspect `components/ui`
- inspect relevant product components
- inspect layout components
- inspect global styles
- inspect theme/tokens
- inspect existing component variants

Reuse existing patterns wherever possible.

### 2. Identify the design system primitives

Break the Figma screen into:

- existing UI primitives
- existing product components
- layout structures
- truly new components

Do not treat the entire Figma frame as one large component.

### 3. Map Figma values to tokens

For every:

- color
- spacing
- radius
- font style
- shadow
- border
- state

first check whether a matching token already exists.

If the Figma design introduces a recurring visual value that does not exist yet, consider adding a semantic token instead of repeating a raw value.

### 4. Reuse existing components

Example:

Bad:

```tsx
<button className="h-[48px] rounded-[12px] bg-[#625BF6] px-[20px]">
  Continue
</button>
```

Preferred:

```tsx
<Button variant="primary" size="lg">
  Continue
</Button>
```

### 5. Extend instead of duplicate

If an existing component is close to the Figma design:

- add a reusable variant
- add a size
- add a semantic prop
- improve the existing primitive

Do not create a second nearly identical component.

### 6. Use shadcn primitives for behavior

If the design contains a modal, dropdown, popover, sheet, select, tooltip, tabs, etc., prefer existing project/shadcn primitives.

Keep the interaction logic and accessibility, then style it to match the Figma design.

---

## Variants

Prefer structured variants instead of repeated conditional classes.

Example:

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center transition-colors",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary-hover",
        secondary:
          "bg-secondary text-secondary-foreground",
        ghost:
          "bg-transparent hover:bg-muted",
      },
      size: {
        sm: "h-8 px-3",
        md: "h-10 px-4",
        lg: "h-12 px-5",
      },
    },
  }
)
```

Prefer APIs such as:

```tsx
<Button variant="secondary" size="md" />
```

over manually supplying custom classes everywhere.

---

## Consistency Rules

Always follow these rules:

- Reuse existing `components/ui` first.
- Reuse existing design tokens.
- Avoid one-off Tailwind arbitrary values unless necessary.
- Avoid raw hex colors when semantic tokens exist.
- Avoid duplicated low-level components.
- Avoid page-specific versions of generic primitives.
- Keep Figma variants aligned with React component variants.
- Prefer composition over monolithic generated components.
- Preserve accessibility and keyboard behavior.
- Make responsive behavior intentional.
- Use existing icon libraries/components when they match the design.
- Keep naming consistent with the existing codebase.
- Follow the project's framework and styling conventions.

---

## What NOT to Do

Do not blindly convert Figma into generated JSX like this:

```tsx
<div className="absolute left-[31px] top-[72px] w-[427px] ...">
```

Avoid:

- excessive absolute positioning
- massive generated JSX trees
- arbitrary pixel values everywhere
- duplicate buttons/cards/inputs
- raw Figma layer names as component names
- rebuilding accessible primitives from scratch
- default shadcn styling when Figma defines a different look
- creating new primitives without inspecting the codebase first

Figma output is a **reference for intent**, not final production code.

---

## Preferred Decision Process

For every UI element, ask:

```text
Does this already exist in components/ui?
    ↓ yes
Reuse it.
    ↓ no

Does a similar component exist that can be extended?
    ↓ yes
Add a reusable variant or prop.
    ↓ no

Is this interactive behavior already solved by shadcn/ui?
    ↓ yes
Use the primitive and customize its visual styling.
    ↓ no

Is this a reusable product component?
    ↓ yes
Create it under components/product.
    ↓ no

Implement it locally only if it is genuinely one-off.
```

---

## Example: Custom Figma Dialog

Figma may visually define a completely custom modal.

Do not build dialog behavior manually.

Prefer:

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Delete project</Button>
  </DialogTrigger>

  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete project</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>

    <DialogFooter>
      <Button variant="secondary">Cancel</Button>
      <Button variant="destructive">Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

Then style `DialogContent`, overlay, typography, spacing, radius, shadows, and animation according to the Figma design.

---

## When a New Figma Design Does Not Match the Existing System

If the Figma design introduces a new visual pattern:

1. Determine whether it is intentional and reusable.
2. Check whether the existing design token should change.
3. Check whether an existing component needs a new variant.
4. Prefer updating the design system over adding local hacks.
5. Keep backward compatibility where reasonable.

Do not silently introduce inconsistent one-off styling.

---

## Figma Code Connect

If Code Connect mappings are available, prefer mapped code components over generating new equivalents.

A Figma component such as:

```text
Button
variant = Primary
size = Large
```

should resolve to something like:

```tsx
<Button variant="primary" size="lg" />
```

Mapped code components should have higher priority than raw generated Figma markup.

---

## Expected Result

The final application should:

- visually match the custom Figma design
- remain consistent across pages
- reuse the project's design system
- use shadcn/ui where it adds behavior/accessibility value
- avoid looking like default shadcn
- minimize hardcoded visual values
- use reusable variants and tokens
- be easy to maintain and extend
- allow future Figma screens to be implemented using the same primitives

The objective is **not**:

> Figma → generated HTML

The objective is:

> Figma → existing design language → reusable components → production-quality UI

---

## Short Instruction for Every Figma Task

When implementing any Figma design, follow this instruction:

```text
Inspect the existing codebase before writing new UI.

Use existing components from components/ui whenever possible.
Reuse existing design tokens and component variants.

Treat the Figma design as the visual source of truth, but do not
translate it literally into one-off JSX or arbitrary Tailwind values.

Map Figma components and variants to existing React components.

Use shadcn/ui primitives for interactive behavior and accessibility
where appropriate, but customize them to match the project's visual
design system.

Do not create a new low-level UI component if an equivalent already
exists.

If an existing component is close, extend it with a reusable variant
instead of duplicating it.

Avoid hardcoded colors, spacing, radii, typography and shadows when
an equivalent design token exists.

The final code should visually match Figma while remaining consistent
with the rest of the application and reusable for future screens.
```
