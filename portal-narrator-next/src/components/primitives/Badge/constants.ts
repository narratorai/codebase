export const BASE_BADGE_STYLES = [
  // Base
  'inline-flex items-center gap-x-0.5 text-xs font-medium',
  '[&>[data-slot=icon]]:size-3.5',
]

export const SOLID_BADGE_STYLES = [
  // Default
  'bg-[--light-solid-accent] dark:bg-[--dark-solid-accent] text-[var(--any-solid-complement,var(--light-solid-complement))] dark:text-[var(--any-solid-complement,var(--dark-solid-complement))]',
  // Hover
  'group-data-[hover]:bg-[--light-solid-accent-hover] dark:group-data-[hover]:bg-[--dark-solid-accent-hover]',
]

export const SOFT_BADGE_STYLES = [
  // Default
  'bg-[--light-soft-complement] dark:bg-[--dark-soft-complement] text-[var(--any-soft-accent,var(--light-soft-accent))] dark:text-[var(--any-soft-accent,var(--dark-soft-accent))]',
  // Hover
  'group-data-[hover]:bg-[--light-soft-complement-hover] dark:group-data-[hover]:bg-[--dark-soft-complement-hover]',
]

export const OUTLINE_BADGE_STYLES = [
  // Base
  'ring-1 ring-inset',
  // Default
  'bg-[--light-soft-complement] dark:bg-[--dark-soft-complement] text-[var(--any-soft-accent,var(--light-soft-accent))] dark:text-[var(--any-soft-accent,var(--dark-soft-accent))] ring-[var(--light-soft-outline,var(--light-soft-accent))] dark:ring-[var(--dark-soft-outline,var(--dark-soft-accent))]',
  // Hover
  'group-data-[hover]:bg-[--light-soft-complement-hover] dark:group-data-[hover]:bg-[--dark-soft-complement-hover]',
]

export const BADGE_BUTTON_STYLES = [
  // Base
  'group relative inline-flex focus:outline-none',
  // Disabled
  'data-[disabled]:opacity-50',
  // Focus
  'data-[focus]:outline data-[focus]:outline-2 data-[focus]:outline-offset-2',
]

export const SOLID_BADGE_BUTTON_STYLES = [
  // Focus
  'data-[focus]:outline-[--light-solid-accent-focus] dark:data-[focus]:outline-[--dark-solid-accent-focus]',
]

export const SOFT_BADGE_BUTTON_STYLES = [
  // Focus
  'data-[focus]:outline-[--light-soft-accent-focus] dark:data-[focus]:outline-[--dark-soft-accent-focus]',
]

export const REMOVE_BUTTON_STYLES = [
  // Base
  'group relative -mr-1 h-3.5 w-3.5',
  // Disabled
  'data-[disabled]:opacity-50',
]

export const SOLID_REMOVE_BUTTON_ICON_STYLES = [
  // Base
  'h-3.5 w-3.5',
  // Default
  'stroke-[var(--any-solid-complement,var(--light-solid-complement))] dark:stroke-[var(--any-solid-complement,var(--dark-solid-complement))]',
  // Hover
  'group-data-[hover]:bg-[--light-solid-accent-icon-hover] dark:group-data-[hover]:bg-[--dark-solid-accent-icon-hover]',
]

export const SOFT_REMOVE_BUTTON_ICON_STYLES = [
  // Base
  'h-3.5 w-3.5',
  // Default
  'stroke-[--light-soft-accent] dark:stroke-[--dark-soft-accent]',
  // Hover
  'group-data-[hover]:bg-[--light-soft-complement-hover] dark:group-data-[hover]:bg-[--dark-soft-complement-hover]',
]

export const SIZES = {
  sm: 'px-1.5 py-0.5',
  md: 'px-2 py-1',
}
