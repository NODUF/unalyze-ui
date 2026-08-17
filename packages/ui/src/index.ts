/**
 * @noduf/unalyze-ui — public API.
 *
 * Everything exported here is covered by semver. Anything not exported here is an implementation
 * detail and may change in a patch, so nothing outside this file should be deep-imported.
 *
 * Consuming an update:
 *
 *   import '@noduf/unalyze-ui/styles.css'          // once, at the app root, before your own styles
 *   <UnalyzeProvider theme="light" locale="cs">…</UnalyzeProvider>
 *   import { Button } from '@noduf/unalyze-ui'
 */

export { UnalyzeProvider, useUnalyze } from './provider'
export type {
  UnalyzeProviderProps,
  UnalyzeStrings,
  UnalyzeLocale,
  UnalyzeTheme,
} from './provider'

export { Button } from './components/button'
export type { ButtonProps } from './components/button'
export { buttonVariants } from './components/button-variants'
export type { ButtonVariantProps } from './components/button-variants'

export { IconButton } from './components/icon-button'
export type { IconButtonProps } from './components/icon-button'

export { Surface, surfaceVariants } from './components/surface'
export type { SurfaceProps, SurfaceVariantProps } from './components/surface'

export { Text, Heading, textVariants } from './components/text'
export type { TextProps, HeadingProps, TextVariantProps } from './components/text'

export { Label, labelVariants } from './components/label'
export type { LabelProps, LabelVariantProps } from './components/label'

export { Input, Textarea, fieldVariants } from './components/input'
export type { InputProps, TextareaProps, FieldVariantProps } from './components/input'

export { FormField } from './components/form-field'
export type { FormFieldProps } from './components/form-field'

export { Checkbox } from './components/checkbox'
export type { CheckboxProps } from './components/checkbox'

export { Switch } from './components/switch'
export type { SwitchProps } from './components/switch'

export { Badge, badgeVariants } from './components/badge'
export type { BadgeProps, BadgeVariantProps } from './components/badge'

export { Divider, Spinner, Skeleton, EmptyState, dividerVariants } from './components/feedback'
export type {
  DividerProps,
  DividerVariantProps,
  SpinnerProps,
  SkeletonProps,
  EmptyStateProps,
} from './components/feedback'

/* ------------------------------------------------------------------ *
 * Overlays and navigation — Radix behaviour, Unalyze material
 * ------------------------------------------------------------------ */

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './components/dialog'
export type { DialogContentProps } from './components/dialog'

export {
  Popover,
  PopoverTrigger,
  PopoverAnchor,
  PopoverClose,
  PopoverContent,
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipTip,
} from './components/popover'
export type { TooltipContentProps } from './components/popover'

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectSeparator,
} from './components/menu'
export type { SelectTriggerProps } from './components/menu'

export { Tabs, TabsList, TabsTrigger, TabsContent } from './components/tabs'
export type { TabsTriggerProps } from './components/tabs'

/**
 * Exported so the consuming team can compose our variant helpers safely in their own code.
 * It is prefix-aware; a hand-rolled `clsx` call is not, and will produce conflicting utilities
 * that resolve by stylesheet order rather than by intent.
 */
export { cn } from './lib/cn'
