export const AVATAR_EXTENDED_STYLES = [
  // Base
  'outline outline-1 -outline-offset-1 outline-[--light-outline] dark:outline-[--dark-outline]',
  // Default
  'bg-[--light-accent] dark:bg-[--dark-accent] text-[var(--any-complement,var(--light-complement))] dark:text-[var(--any-complement,var(--dark-complement))]',
  // Hover
  'group-data-[hover]:bg-[--light-accent-hover] dark:group-data-[hover]:bg-[--dark-accent-hover]',
]

export const AVATAR_SQUARE_STYLES = 'rounded-[20%] *:rounded-[20%]'

export const AVATAR_ROUND_STYLES = 'rounded-full *:rounded-full'

export const AVATAR_RING_STYLES = 'ring-2 ring-white dark:ring-zinc-900'

export const AVATAR_DETAILS_SQUARE_STYLES = 'rounded-sm *:rounded-sm'

export const SIZES = {
  lg: 'size-12',
  md: 'size-9',
  sm: 'size-6',
  xl: 'size-14',
  xs: 'size-4',
}

export const SPREADS = {
  lg: '-space-x-2',
  md: '-space-x-4',
  sm: '-space-x-8',
}

export const DIMENSIONS = {
  lg: 48,
  md: 36,
  sm: 24,
  xl: 56,
  xs: 16,
}
