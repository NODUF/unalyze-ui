import type { FormEvent } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from '../components/button'
import { buttonVariants } from '../components/button-variants'
import { IconButton, type IconButtonProps } from '../components/icon-button'
import { Badge } from '../components/badge'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/menu'
import { Popover, PopoverContent, PopoverTrigger, TooltipTip } from '../components/popover'
import { glassControl, glassControlActive } from '../lib/material'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/tabs'
import { Checkbox } from '../components/checkbox'
import { Divider, EmptyState, Skeleton, Spinner } from '../components/feedback'
import { FormField } from '../components/form-field'
import { Input, Textarea } from '../components/input'
import { Label } from '../components/label'
import { Switch } from '../components/switch'
import { Surface } from '../components/surface'
import { Heading, Text } from '../components/text'
import { UnalyzeProvider } from '../provider'
import { cn } from '../lib/cn'
import { describeConformance } from './conformance'

/* ------------------------------------------------------------------ *
 * Gate G5 — every component through the same floor
 * ------------------------------------------------------------------ */

describeConformance({
  name: 'Button',
  Component: Button,
  requiredProps: { children: 'Continue' },
  variants: {
    variant: ['primary', 'glass', 'secondary', 'outline', 'ghost', 'destructive'],
    size: ['sm', 'md', 'lg', 'icon-sm', 'icon-md', 'icon-lg'],
    block: [true, false],
    loading: [true, false],
  },
})

describeConformance({
  name: 'Surface',
  Component: Surface,
  requiredProps: { children: 'Panel' },
  variants: {
    level: ['glass', 'flat', 'raised', 'overlay', 'sunken', 'none'],
    radius: ['none', 'sm', 'md', 'lg', 'full'],
    padding: ['none', 'sm', 'md', 'lg'],
    border: [true, false],
    clip: [true, false],
  },
})

describeConformance({
  name: 'Text',
  Component: Text,
  requiredProps: { children: 'Body copy' },
  variants: {
    variant: [
      'display',
      'value-xl',
      'value-lg',
      'value',
      'value-sm',
      'title',
      'title-sm',
      'body',
      'label',
      'label-sm',
      'caption',
    ],
    size: ['10', 'xs', '13', 'sm', '15', 'base', 'lg', 'xl', '21', '2xl', '28', '3xl', '4xl'],
    tone: [
      'default',
      'muted',
      'subtle',
      'positive',
      'negative',
      'neutral',
      'warning',
      'info',
      'destructive',
      'inherit',
    ],
    weight: ['normal', 'medium', 'semibold', 'bold'],
    family: ['sans', 'display', 'mono'],
    numeric: [true, false],
  },
})

/* ------------------------------------------------------------------ *
 * Behaviour that the conformance floor does not cover
 * ------------------------------------------------------------------ */

describe('Button', () => {
  it('defaults to type="button"', async () => {
    // A button inside a form that silently submits it is one of the most common
    // accidental-data-loss bugs in a product, and it is a default, not a decision.
    const onSubmit = vi.fn((e: FormEvent) => e.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <Button>Not a submit</Button>
      </form>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Not a submit' }))
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('blocks interaction and announces itself while loading', async () => {
    const onClick = vi.fn()
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    )

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button.getAttribute('aria-busy')).toBe('true')
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('keeps its label visible while loading so the layout does not shift', () => {
    render(<Button loading>Save</Button>)
    expect(screen.getByRole('button').textContent).toContain('Save')
  })

  it('takes the loading announcement from the provider locale', () => {
    render(
      <UnalyzeProvider locale="cs" applyThemeToDocument={false}>
        <Button loading>Uložit</Button>
      </UnalyzeProvider>,
    )
    expect(screen.getByRole('button').textContent).toContain('Načítání')
  })

  it('hides decorative icons from assistive technology', () => {
    render(<Button icon={<svg data-testid="icon" />}>Refresh</Button>)
    // The icon must not be announced: the label already says what the button does.
    expect(screen.getByTestId('icon').closest('[aria-hidden="true"]')).not.toBeNull()
  })

  it('is operable from the keyboard', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Press</Button>)

    await userEvent.tab()
    expect(screen.getByRole('button')).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    expect(onClick).toHaveBeenCalledTimes(2)
  })
})

describe('Text and Heading', () => {
  it('renders the element it is told to, not the one its size implies', () => {
    // Size and semantics are separate: a visually small heading is still a heading.
    const { container } = render(
      <Heading level={2} size="sm">
        Small but still an h2
      </Heading>,
    )
    expect(container.querySelector('h2')).not.toBeNull()
  })

  it('leaves the ARIA role attribute alone', () => {
    // The style axis is called `variant` precisely so it cannot shadow this. A prop named `role`
    // would have made `<Text role="status">` silently stop announcing.
    const { container } = render(
      <Text role="status" variant="value">
        +446.04
      </Text>,
    )
    expect(container.firstElementChild?.getAttribute('role')).toBe('status')
    expect((container.firstElementChild as HTMLElement).dataset.variant).toBe('value')
  })

  it('asks for tabular figures on numeric text', () => {
    // A no-op on a face without the feature, so it costs nothing and starts working the moment
    // the font supports it. Worth confirming against the real Nohemi files.
    const { container } = render(<Text numeric>1 234,56</Text>)
    expect((container.firstElementChild as HTMLElement).className).toContain('un-numeric')
  })

  it('renders every heading level as the matching tag', () => {
    for (const level of [1, 2, 3, 4, 5, 6] as const) {
      const { container, unmount } = render(<Heading level={level}>Title</Heading>)
      expect(container.querySelector(`h${level}`)).not.toBeNull()
      unmount()
    }
  })

  it('exposes tone as a data attribute for downstream styling', () => {
    const { container } = render(<Text tone="negative">−128.40</Text>)
    expect((container.firstElementChild as HTMLElement).dataset.tone).toBe('negative')
  })
})

describe('UnalyzeProvider', () => {
  it('writes the theme onto <html> so portalled surfaces inherit it', () => {
    // Dialogs, popovers and toasts render into document.body, outside any wrapper the provider
    // could own. Without this every overlay in the product falls back to the light theme.
    const { unmount } = render(
      <UnalyzeProvider theme="dark">
        <Text>Content</Text>
      </UnalyzeProvider>,
    )
    expect(document.documentElement.getAttribute('data-un-theme')).toBe('dark')
    unmount()
    expect(document.documentElement.getAttribute('data-un-theme')).toBeNull()
  })

  it('restores a theme the host application set itself', () => {
    // The host may already own the attribute; an unmounting provider must not strip their value.
    document.documentElement.setAttribute('data-un-theme', 'host-owned')
    const { unmount } = render(
      <UnalyzeProvider theme="dark">
        <Text>Content</Text>
      </UnalyzeProvider>,
    )
    unmount()
    expect(document.documentElement.getAttribute('data-un-theme')).toBe('host-owned')
    document.documentElement.removeAttribute('data-un-theme')
  })

  it('does not introduce a layout box', () => {
    // The wrapper exists only to carry the SSR theme attribute. If it ever became a real box it
    // would break every flex and grid the consuming team puts around our components.
    const { container } = render(
      <UnalyzeProvider applyThemeToDocument={false}>
        <Text>Content</Text>
      </UnalyzeProvider>,
    )
    const wrapper = container.querySelector('[data-un-root]') as HTMLElement
    expect(wrapper.style.display).toBe('contents')
  })

  it('renders unwrapped components rather than throwing', () => {
    // A library that crashes because someone forgot a wrapper is a bad neighbour.
    expect(() => render(<Button loading>Save</Button>)).not.toThrow()
    expect(screen.getByRole('button').textContent).toContain('Loading')
  })
})

describe('cn', () => {
  it('resolves conflicts between our own prefixed utilities', () => {
    // Without prefix-aware merging both classes survive and padding is decided by stylesheet
    // order — a silent, untraceable wrong value.
    expect(cn('u:px-4', 'u:px-8')).toBe('u:px-8')
  })

  it('leaves the consumer\'s own unprefixed classes alone', () => {
    // We cannot know their Tailwind config, and dropping their class would be worse than
    // letting the cascade decide.
    expect(cn('u:px-4', 'px-8')).toBe('u:px-4 px-8')
  })
})

/* ------------------------------------------------------------------ *
 * Core UI batch 1 — form controls
 * ------------------------------------------------------------------ */

describeConformance({
  name: 'Label',
  Component: Label,
  requiredProps: { children: 'Account' },
  variants: { size: ['sm', 'md'], required: [true, false] },
})

describeConformance({
  name: 'Input',
  Component: Input,
  requiredProps: { 'aria-label': 'Amount' },
  variants: {
    size: ['sm', 'md', 'lg'],
    inset: ['none', 'start', 'end', 'both'],
    numeric: [true, false],
  },
})

describeConformance({
  name: 'Textarea',
  Component: Textarea,
  requiredProps: { 'aria-label': 'Notes' },
  variants: { size: ['sm', 'md', 'lg'] },
})

describeConformance({
  name: 'Checkbox',
  Component: Checkbox,
  requiredProps: { children: 'Include weekends' },
  variants: { indeterminate: [true, false], disabled: [true, false] },
  // The root is the <label>, which carries the styling; the <input> inside it is the control, so
  // that is where the ref points and where props land.
  skipRefTest: true,
  propsTarget: 'input',
})

describeConformance({
  name: 'Switch',
  Component: Switch,
  requiredProps: { children: 'Live sync' },
  variants: { disabled: [true, false] },
  skipRefTest: true,
  propsTarget: 'input',
})

describe('Input', () => {
  it('is reachable and editable from the keyboard', async () => {
    render(<Input aria-label="Amount" />)
    await userEvent.tab()
    const input = screen.getByLabelText('Amount')
    expect(input).toHaveFocus()
    await userEvent.type(input, '1284')
    expect(input).toHaveValue('1284')
  })

  it('keeps decorative icons out of the accessibility tree and out of the way of clicks', () => {
    // An icon that swallows pointer events stops the field focusing when a user aims at its edge.
    const { container } = render(<Input aria-label="Search" icon={<svg data-testid="i" />} />)
    const affix = screen.getByTestId('i').closest('[aria-hidden="true"]') as HTMLElement
    expect(affix).not.toBeNull()
    expect(affix.className).toContain('pointer-events-none')
    // The field pads itself so the text cannot run under the icon.
    expect(container.querySelector('input')?.className).toContain('pl-10')
  })
})

describe('FormField', () => {
  it('wires label, hint and control together', () => {
    render(
      <FormField label="Account" hint="Broker server time">
        {(field) => <Input {...field} />}
      </FormField>,
    )
    const input = screen.getByLabelText('Account')
    const describedBy = input.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    expect(document.getElementById(describedBy as string)?.textContent).toBe('Broker server time')
  })

  it('marks the control invalid and announces the error', () => {
    render(
      <FormField label="Amount" error="Enter a number">
        {(field) => <Input {...field} />}
      </FormField>,
    )
    const input = screen.getByLabelText('Amount')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    // role="alert" so it is announced on appearance, not only on next focus.
    expect(screen.getByRole('alert').textContent).toBe('Enter a number')
    expect(input.getAttribute('aria-describedby')).toContain(screen.getByRole('alert').id)
  })

  it('replaces the hint with the error rather than showing both', () => {
    // Two messages in one slot is how a user ends up reading the wrong one.
    render(
      <FormField label="Amount" hint="Up to 2 decimals" error="Enter a number">
        {(field) => <Input {...field} />}
      </FormField>,
    )
    expect(screen.queryByText('Up to 2 decimals')).toBeNull()
  })

  it('announces a required field in words, not only as an asterisk', () => {
    // Screen readers announce a bare `*` as "star", or skip it.
    render(
      <FormField label="Account" required requiredLabel="povinné">
        {(field) => <Input {...field} />}
      </FormField>,
    )
    expect(screen.getByText('povinné')).toBeInTheDocument()
    expect(screen.getByLabelText(/Account/)).toBeRequired()
  })
})

describe('Checkbox and Switch', () => {
  it('checkbox toggles with the space bar', async () => {
    render(<Checkbox>Include weekends</Checkbox>)
    const box = screen.getByRole('checkbox')
    await userEvent.tab()
    expect(box).toHaveFocus()
    await userEvent.keyboard(' ')
    expect(box).toBeChecked()
  })

  it('checkbox sets indeterminate as a property, which JSX cannot do', () => {
    render(<Checkbox indeterminate>Partly</Checkbox>)
    expect((screen.getByRole('checkbox') as HTMLInputElement).indeterminate).toBe(true)
  })

  it('switch announces as on/off rather than checked/unchecked', () => {
    render(<Switch defaultChecked>Live sync</Switch>)
    expect(screen.getByRole('switch')).toBeChecked()
  })

  it('both stay in the accessibility tree despite the custom visuals', () => {
    // `sr-only`, never `display:none` — the latter removes the input from the tab order entirely,
    // which is the classic way a custom control becomes keyboard-unreachable.
    render(
      <>
        <Checkbox>A</Checkbox>
        <Switch>B</Switch>
      </>,
    )
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })
})

/* ------------------------------------------------------------------ *
 * Core UI batch 2 — display and feedback
 * ------------------------------------------------------------------ */

describeConformance({
  name: 'Badge',
  Component: Badge,
  requiredProps: { children: '11 days' },
  variants: {
    variant: ['accent', 'neutral', 'count', 'positive', 'negative', 'warning', 'outline'],
    size: ['sm', 'md'],
    count: [true, false],
  },
})

describeConformance({
  name: 'Divider',
  Component: Divider,
  requiredProps: {},
  variants: { orientation: ['horizontal', 'vertical'] },
})

describeConformance({
  name: 'Skeleton',
  Component: Skeleton,
  requiredProps: {},
  variants: { shape: ['text', 'block', 'circle'] },
})

describeConformance({
  name: 'EmptyState',
  Component: EmptyState,
  requiredProps: { title: 'No trades yet' },
})

describe('Divider', () => {
  it('announces its real orientation', () => {
    // A bare <hr> is announced as horizontal whichever way it is drawn, which is misleading in a
    // row of metrics.
    render(<Divider orientation="vertical" />)
    expect(screen.getByRole('separator').getAttribute('aria-orientation')).toBe('vertical')
  })
})

describe('Spinner', () => {
  it('announces itself and takes its wording from the locale', () => {
    render(
      <UnalyzeProvider locale="cs" applyThemeToDocument={false}>
        <Spinner />
      </UnalyzeProvider>,
    )
    expect(screen.getByRole('status').textContent).toContain('Načítání')
  })

  it('is exempt from the reduced-motion backstop', () => {
    // A frozen spinner reads as a hung interface, which is worse than a moving one.
    const { container } = render(<Spinner />)
    expect(container.querySelector('[data-un-allow-motion]')).not.toBeNull()
  })
})

describe('Skeleton', () => {
  it('says nothing to assistive technology', () => {
    // The region that owns the load announces once; a placeholder per bar would announce ten times.
    const { container } = render(<Skeleton />)
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true')
  })

  it('does NOT claim the motion exemption', () => {
    // Unlike the spinner, a still skeleton communicates perfectly well.
    const { container } = render(<Skeleton />)
    expect(container.querySelector('[data-un-allow-motion]')).toBeNull()
  })
})

describe('EmptyState', () => {
  it('renders title, description and a single action', () => {
    render(
      <EmptyState
        title="No trades yet"
        description="Connect an account to see them here."
        action={<Button>Add account</Button>}
      />,
    )
    expect(screen.getByText('No trades yet')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add account' })).toBeInTheDocument()
  })
})

/* ------------------------------------------------------------------ *
 * Core UI batch 3 — overlays and navigation
 *
 * These assert BEHAVIOUR, not appearance. The visuals are `@derived` and will be replaced when
 * the design lands; the keyboard and focus contracts below are the reason these wrap Radix and
 * will not change with a restyle.
 * ------------------------------------------------------------------ */

/** Every overlay needs a provider for portals and tooltip timing. */
const inProvider = (ui: React.ReactNode) =>
  render(<UnalyzeProvider applyThemeToDocument={false}>{ui}</UnalyzeProvider>)

describe('Dialog', () => {
  const Example = () => (
    <Dialog>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete account</DialogTitle>
          <DialogDescription>This cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose>Cancel</DialogClose>
          <Button variant="destructive">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  it('opens from the trigger and names itself', async () => {
    inProvider(<Example />)
    await userEvent.click(screen.getByText('Open'))
    // Radix wires the title as the accessible name; without a DialogTitle it would have none.
    expect(screen.getByRole('dialog', { name: 'Delete account' })).toBeInTheDocument()
  })

  it('closes on Escape and returns focus to the trigger', async () => {
    inProvider(<Example />)
    const trigger = screen.getByText('Open')
    await userEvent.click(trigger)
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    // Losing focus to <body> on close is the single most common custom-modal bug.
    expect(trigger).toHaveFocus()
  })

  it('moves focus into the dialog rather than leaving it on the page', async () => {
    inProvider(<Example />)
    await userEvent.click(screen.getByText('Open'))
    const dialog = screen.getByRole('dialog')
    expect(dialog.contains(document.activeElement)).toBe(true)
  })

  it('carries a close button labelled from the locale', async () => {
    render(
      <UnalyzeProvider locale="cs" applyThemeToDocument={false}>
        <Example />
      </UnalyzeProvider>,
    )
    await userEvent.click(screen.getByText('Open'))
    expect(screen.getByRole('button', { name: 'Zavřít' })).toBeInTheDocument()
  })

  it('can drop the close button for a dialog that must be resolved by its actions', async () => {
    inProvider(
      <Dialog defaultOpen>
        <DialogContent hideClose>
          <DialogTitle>Confirm</DialogTitle>
        </DialogContent>
      </Dialog>,
    )
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull()
  })
})

describe('Tabs', () => {
  const Example = () => (
    <Tabs defaultValue="dashboard">
      <TabsList>
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="achievements">Úspěchy</TabsTrigger>
        <TabsTrigger value="community" locked lockedLabel="Coming soon">
          Komunita
        </TabsTrigger>
      </TabsList>
      <TabsContent value="dashboard">Dashboard panel</TabsContent>
      <TabsContent value="achievements">Achievements panel</TabsContent>
    </Tabs>
  )

  it('moves between tabs with arrow keys, not with Tab', async () => {
    // A row of plain buttons makes a keyboard user press Tab once per destination to get past
    // the navigation. This is the contract that gets lost when tabs are hand-rolled.
    inProvider(<Example />)
    await userEvent.tab()
    expect(screen.getByRole('tab', { name: 'Dashboard' })).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Úspěchy' })).toHaveFocus()
  })

  it('shows only the selected panel', async () => {
    inProvider(<Example />)
    expect(screen.getByText('Dashboard panel')).toBeInTheDocument()
    expect(screen.queryByText('Achievements panel')).toBeNull()
    await userEvent.click(screen.getByRole('tab', { name: 'Úspěchy' }))
    expect(screen.getByText('Achievements panel')).toBeInTheDocument()
  })

  it('keeps a locked destination visible, disabled and explained', () => {
    inProvider(<Example />)
    const locked = screen.getByRole('tab', { name: /Komunita/ })
    expect(locked).toBeDisabled()
    // The lock glyph is decorative; the reason has to be readable rather than inferred.
    expect(locked.textContent).toContain('Coming soon')
  })
})

describe('Select', () => {
  const Example = () => (
    <Select>
      <SelectTrigger aria-label="Year">
        <SelectValue placeholder="Select a year" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="2026">2026</SelectItem>
        <SelectItem value="2025">2025</SelectItem>
      </SelectContent>
    </Select>
  )

  it('announces itself as a combobox and shows the placeholder', () => {
    inProvider(<Example />)
    expect(screen.getByRole('combobox', { name: 'Year' })).toBeInTheDocument()
    expect(screen.getByText('Select a year')).toBeInTheDocument()
  })

  it('opens from the keyboard and selects a value', async () => {
    inProvider(<Example />)
    const trigger = screen.getByRole('combobox', { name: 'Year' })
    trigger.focus()
    await userEvent.keyboard('{Enter}')
    await userEvent.click(await screen.findByRole('option', { name: '2026' }))
    expect(trigger.textContent).toContain('2026')
  })
})

describe('DropdownMenu', () => {
  it('opens, exposes its items and closes on Escape', async () => {
    inProvider(
      <DropdownMenu>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Trade</DropdownMenuLabel>
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    )

    await userEvent.click(screen.getByText('Actions'))
    expect(await screen.findByRole('menuitem', { name: 'Edit' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('menuitem', { name: 'Edit' })).toBeNull()
  })
})

describe('Popover and Tooltip', () => {
  it('popover holds interactive content and closes on Escape', async () => {
    inProvider(
      <Popover>
        <PopoverTrigger>Filters</PopoverTrigger>
        <PopoverContent>
          <Button>Apply</Button>
        </PopoverContent>
      </Popover>,
    )
    await userEvent.click(screen.getByText('Filters'))
    expect(await screen.findByRole('button', { name: 'Apply' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('button', { name: 'Apply' })).toBeNull()
  })

  it('tooltip opens on focus, not only on hover', async () => {
    // A tooltip that only answers to a pointer is invisible to the audience that needed it.
    inProvider(
      <TooltipTip label="Profit factor">
        <button>Info</button>
      </TooltipTip>,
    )
    await userEvent.tab()
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Profit factor')
  })
})

/* ------------------------------------------------------------------ *
 * IconButton, and the reuse it enforces
 * ------------------------------------------------------------------ */

describeConformance({
  name: 'IconButton',
  Component: IconButton,
  requiredProps: { label: 'Refresh', icon: <svg /> },
  variants: {
    variant: ['primary', 'glass', 'secondary', 'outline', 'ghost', 'destructive'],
    size: ['sm', 'md', 'lg'],
    loading: [true, false],
    showLabel: [true, false],
  },
})

describe('IconButton', () => {
  it('always has an accessible name', () => {
    // A button containing only an SVG is announced as "button" and nothing else. `label` is a
    // required prop precisely so that cannot happen.
    render(<IconButton label="Refresh trades" icon={<svg />} />)
    expect(screen.getByRole('button', { name: 'Refresh trades' })).toBeInTheDocument()
  })

  it('renders exactly the classes Button renders, for every variant', () => {
    /**
     * Parity is structural — IconButton passes `variant` straight into the same cva definition —
     * and this proves it end to end rather than trusting that. If IconButton ever grows its own
     * class strings, the day they diverge is the day this fails.
     *
     * cva does not expose its config, so the variant list is written out; it is the same list the
     * conformance block above exercises, so a variant added to one and not the other shows up as
     * two failures rather than none.
     */
    const VARIANTS = ['primary', 'glass', 'secondary', 'outline', 'ghost', 'destructive'] as const

    for (const variant of VARIANTS) {
      const { unmount } = render(<IconButton label={variant} icon={<svg />} variant={variant} />)
      const rendered = screen.getByRole('button', { name: variant }).className

      // Through `cn` as well, because that is what the component does. `outline` sets
      // `border-input` over the base `border-transparent`, and twMerge drops the loser — so the
      // raw cva output legitimately contains a class the rendered element must not have.
      for (const cls of cn(buttonVariants({ variant, size: 'icon-md' })).split(/\s+/).filter(Boolean)) {
        expect(rendered, `${variant}: IconButton is missing "${cls}"`).toContain(cls)
      }
      unmount()
    }
  })

  it('shows the label as text when asked, and drops the duplicate aria-label', () => {
    render(<IconButton showLabel label="Add account" icon={<svg />} />)
    const button = screen.getByRole('button', { name: 'Add account' })
    // Keeping aria-label alongside visible text would make the name announced twice, or worse,
    // let the two drift apart.
    expect(button).not.toHaveAttribute('aria-label')
  })

  it('blocks interaction and announces itself while loading', async () => {
    const onClick = vi.fn()
    render(<IconButton loading label="Refresh" icon={<svg />} onClick={onClick} />)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button.getAttribute('aria-busy')).toBe('true')
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('component reuse', () => {
  it("Dialog's close is the real IconButton, not a lookalike", () => {
    // The whole point of a design system: a second nearly-identical button inside Dialog would be
    // identical the day it was written and subtly different a month later.
    render(
      <UnalyzeProvider applyThemeToDocument={false}>
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      </UnalyzeProvider>,
    )
    const close = screen.getByRole('button', { name: 'Close' })
    expect(close.dataset.unComponent).toBe('iconbutton')
  })

  it('there is one spinner glyph, not one per component', () => {
    // It was duplicated across Button and Spinner and had already started to drift in stroke
    // opacity before being pulled into lib/icons.
    render(
      <>
        <Button loading>Save</Button>
        <Spinner />
        <IconButton loading label="Refresh" icon={<svg />} />
      </>,
    )
    const spinners = document.querySelectorAll('.un-spinner')
    expect(spinners).toHaveLength(3)
    const shapes = new Set([...spinners].map((s) => s.innerHTML))
    expect(shapes.size, 'the spinner is drawn differently in different components').toBe(1)
  })
})

describe('the glass control material', () => {
  /**
   * The design uses ONE surface for every raised control — the active nav tab, the year select,
   * the round buttons. Three components render it, and before this they each described it in
   * their own words: two different greys and two different hover rules that all looked close
   * enough to pass review.
   *
   * These assert they resolve to the same material, so a change to one that is not a change to
   * all three fails here rather than in a screenshot three weeks later.
   */
  const fillOf = (el: Element) =>
    el.className
      .split(/\s+/)
      .filter((c) => c.includes('bg-control') || c.includes('glass-edge'))
      .sort()
      .join(' ')

  it('a glass Button and an active Tab wear the same fill and rim', () => {
    const { container: btn } = render(<Button variant="glass">Filters</Button>)
    const { container: tabs } = render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">Dashboard</TabsTrigger>
        </TabsList>
      </Tabs>,
    )

    const button = btn.querySelector('[data-un-component="button"]') as HTMLElement
    const tab = tabs.querySelector('[data-un-component="tabstrigger"]') as HTMLElement

    // The tab carries the same classes behind a `data-[state=active]:` prefix, so compare the
    // material once the prefix is stripped.
    const tabMaterial = fillOf(tab).replace(/data-\[state=active\]:/g, '')
    expect(tabMaterial).toBe(fillOf(button))
  })

  it('the Select trigger wears it too', () => {
    const { container } = render(
      <UnalyzeProvider applyThemeToDocument={false}>
        <Select>
          <SelectTrigger aria-label="Year">
            <SelectValue placeholder="Pick" />
          </SelectTrigger>
        </Select>
      </UnalyzeProvider>,
    )
    const trigger = container.querySelector('[data-un-component="selecttrigger"]') as HTMLElement
    expect(fillOf(trigger)).toContain('u:bg-control')
    expect(fillOf(trigger)).toContain('u:glass-edge')
  })

  it('every control that wears it also lifts on hover', () => {
    // Fill and rim lift together; lifting one alone reads as a glitch rather than a response.
    for (const material of [glassControl, glassControlActive]) {
      expect(material).toContain('bg-control-hover')
      expect(material).toContain('edge-stops-strong')
    }
  })
})
