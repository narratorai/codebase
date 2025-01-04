export const RECTANGLE_BUTTON_SIZES = {
  sm: 'rounded-md px-3.5 py-2.5 sm:px-3 sm:py-2 text-base sm:text-sm font-semibold gap-x-1.5 [&>[data-slot=icon]]:-mx-0.5 [&>[data-slot=icon]]:my-0.5 [&>[data-slot=icon]]:size-5 [&>[data-slot=icon]]:sm:size-4',
  md: 'rounded-md px-4 py-3 sm:px-3.5 sm:py-2.5 text-base sm:text-sm font-semibold gap-x-2 [&>[data-slot=icon]]:-mx-0.5 [&>[data-slot=icon]]:my-0.5 [&>[data-slot=icon]]:size-5 [&>[data-slot=icon]]:sm:size-4',
  lg: 'rounded-md px-5 py-4 sm:px-4 sm:py-3 text-base font-semibold gap-x-2 [&>[data-slot=icon]]:-mx-0.5 [&>[data-slot=icon]]:my-0.5 [&>[data-slot=icon]]:size-6 [&>[data-slot=icon]]:sm:size-5',
}

export const PILL_BUTTON_SIZES = {
  sm: 'rounded-full px-4 py-2.5 sm:px-3.5 sm:py-2 text-base sm:text-sm font-semibold gap-x-1.5 [&>[data-slot=icon]]:-mx-0.5 [&>[data-slot=icon]]:my-0.5 [&>[data-slot=icon]]:size-5 [&>[data-slot=icon]]:sm:size-4',
  md: 'rounded-full px-5 py-3 sm:px-4 sm:py-2.5 text-base sm:text-sm font-semibold gap-x-2 [&>[data-slot=icon]]:-mx-0.5 [&>[data-slot=icon]]:my-0.5 [&>[data-slot=icon]]:size-5 [&>[data-slot=icon]]:sm:size-4',
  lg: 'rounded-full px-6 py-4 sm:px-5 sm:py-3 text-base font-semibold gap-x-2 [&>[data-slot=icon]]:-mx-0.5 [&>[data-slot=icon]]:my-0.5 [&>[data-slot=icon]]:size-6 [&>[data-slot=icon]]:sm:size-5',
}

export const CIRCLE_BUTTON_SIZES = {
  sm: 'rounded-full p-2.5 sm:p-2 [&>[data-slot=icon]]:size-6 [&>[data-slot=icon]]:sm:size-5',
  md: 'rounded-full p-3 sm:p-2.5 [&>[data-slot=icon]]:size-7 [&>[data-slot=icon]]:sm:size-6',
  lg: 'rounded-full p-3.5 sm:p-3 [&>[data-slot=icon]]:size-9 [&>[data-slot=icon]]:sm:size-8',
}

export const ICON_BUTTON_SIZES = {
  xs: 'rounded-full w-11 h-11 sm:w-9 sm:h-9 [&>[data-slot=icon]]:size-5 sm:[&>[data-slot=icon]]:size-4',
  sm: 'rounded-full w-11 h-11 sm:w-9 sm:h-9 [&>[data-slot=icon]]:size-6 sm:[&>[data-slot=icon]]:size-5',
  md: 'rounded-full w-11 h-11 sm:w-9 sm:h-9 [&>[data-slot=icon]]:size-8 sm:[&>[data-slot=icon]]:size-6',
  lg: 'rounded-full w-11 h-11 sm:w-9 sm:h-9 [&>[data-slot=icon]]:size-10 sm:[&>[data-slot=icon]]:size-8',
  xl: 'rounded-full w-11 h-11 sm:w-9 sm:h-9 [&>[data-slot=icon]]:size-11 sm:[&>[data-slot=icon]]:size-9',
}

export const TRIGGER_BUTTON_SIZE = [
  'rounded-md px-3.5 py-2.5 sm:px-3 sm:py-2 text-base sm:text-sm font-normal gap-x-1.5 [&>[data-slot=icon]]:-mx-0.5 [&>[data-slot=icon]]:my-0.5 [&>[data-slot=icon]]:size-5 [&>[data-slot=icon]]:sm:size-4',
]

export const BASE_BUTTON_STYLES = [
  // Base
  'relative isolate inline-flex items-center justify-center cursor-pointer ring-1 ring-inset',
  // Default
  'bg-[--light-bg] dark:bg-[--dark-bg]',
  'text-[--light-text] dark:text-[--dark-text]',
  'ring-[--light-ring] dark:ring-[--dark-ring]',
  'outline-[--light-outline] dark:outline-[--dark-outline]',
  // Hover
  'data-[hover]:bg-[--light-bg-hover] data-[hover]:dark:bg-[--dark-bg-hover]',
  'data-[hover]:text-[--light-text-hover] data-[hover]:dark:text-[--dark-text-hover]',
  // Active
  'data-[active]:bg-[--light-bg-active] data-[active]:dark:bg-[--dark-bg-active]',
  'data-[active]:text-[--light-text-active] data-[active]:dark:text-[--dark-text-active]',
  // Focus
  'data-[focus]:outline data-[focus]:outline-2 data-[focus]:outline-offset-2',
  'data-[focus]:outline-[--light-outline-focus] data-[focus]:dark:outline-[--dark-outline-focus]',
  // Disabled
  'data-[disabled]:opacity-50',
]

export const SOLID_BUTTON_STYLES = [
  // Base
  'shadow-sm',

  // Light
  '[--light-bg:theme(colors.indigo.600)]',
  '[--light-text:theme(colors.white)]',
  '[--light-ring:theme(colors.transparent)]',
  '[--light-outline:theme(colors.transparent)]',

  '[--light-bg-hover:theme(colors.indigo.500)]',
  '[--light-text-hover:theme(colors.white)]',

  '[--light-outline-focus:theme(colors.indigo.600)]',

  // Dark
  '[--dark-bg:theme(colors.indigo.500)]',
  '[--dark-text:theme(colors.white)]',
  '[--dark-ring:theme(colors.transparent)]',
  '[--dark-outline:theme(colors.transparent)]',

  '[--dark-bg-hover:theme(colors.indigo.400)]',
  '[--dark-text-hover:theme(colors.white)]',

  '[--dark-outline-focus:theme(colors.indigo.500)]',
]

export const SOLID_ICON_BUTTON_STYLES = [
  // Light
  '[--light-bg:theme(colors.transparent)]',
  '[--light-text:theme(colors.indigo.600)]',
  '[--light-ring:theme(colors.transparent)]',
  '[--light-outline:theme(colors.transparent)]',

  '[--light-bg-hover:theme(colors.transparent)]',
  '[--light-text-hover:theme(colors.indigo.500)]',

  '[--light-outline-focus:theme(colors.indigo.600)]',

  // Dark
  '[--dark-bg:theme(colors.transparent)]',
  '[--dark-text:theme(colors.indigo.500)]',
  '[--dark-ring:theme(colors.transparent)]',
  '[--dark-outline:theme(colors.transparent)]',

  '[--dark-bg-hover:theme(colors.transparent)]',
  '[--dark-text-hover:theme(colors.indigo.400)]',

  '[--dark-outline-focus:theme(colors.indigo.500)]',
]

export const PLAIN_BUTTON_STYLES = [
  // Light
  '[--light-bg:theme(colors.white)]',
  '[--light-text:theme(colors.zinc.950)]',
  '[--light-ring:theme(colors.transparent)]',
  '[--light-outline:theme(colors.transparent)]',

  '[--light-bg-hover:theme(colors.zinc.950/5%)]',
  '[--light-text-hover:theme(colors.zinc.950)]',

  '[--light-outline-focus:theme(colors.zinc.950/15%)]',

  // Dark
  '[--dark-bg:theme(colors.white/10%)]',
  '[--dark-text:theme(colors.white)]',
  '[--dark-ring:theme(colors.transparent)]',
  '[--dark-outline:theme(colors.transparent)]',

  '[--dark-bg-hover:theme(colors.white/20%)]',
  '[--dark-text-hover:theme(colors.white)]',

  '[--dark-outline-focus:theme(colors.white/15%)]',
]

export const PLAIN_ICON_BUTTON_STYLES = [
  // Light
  '[--light-bg:theme(colors.transparent)]',
  '[--light-text:theme(colors.zinc.600)]',
  '[--light-ring:theme(colors.transparent)]',
  '[--light-outline:theme(colors.transparent)]',

  '[--light-bg-hover:theme(colors.transparent)]',
  '[--light-text-hover:theme(colors.zinc.500)]',

  '[--light-outline-focus:theme(colors.zinc.600)]',

  // Dark
  '[--dark-bg:theme(colors.transparent)]',
  '[--dark-text:theme(colors.white)]',
  '[--dark-ring:theme(colors.transparent)]',
  '[--dark-outline:theme(colors.transparent)]',

  '[--dark-bg-hover:theme(colors.transparent)]',
  '[--dark-text-hover:theme(colors.white/90%)]',

  '[--dark-outline-focus:theme(colors.white)]',
]

export const OUTLINE_BUTTON_STYLES = [
  // Light
  '[--light-bg:theme(colors.white)]',
  '[--light-text:theme(colors.zinc.950)]',
  '[--light-ring:theme(colors.zinc.950/10%)]',
  '[--light-outline:theme(colors.transparent)]',

  '[--light-bg-hover:theme(colors.zinc.950/2.5%)]',
  '[--light-text-hover:theme(colors.zinc.950)]',

  '[--light-outline-focus:theme(colors.zinc.950/10%)]',

  // Dark
  '[--dark-bg:theme(colors.white/10%)]',
  '[--dark-text:theme(colors.white)]',
  '[--dark-ring:theme(colors.white/15%)]',
  '[--dark-outline:theme(colors.transparent)]',

  '[--dark-bg-hover:theme(colors.white/20%)]',
  '[--dark-text-hover:theme(colors.white)]',

  '[--dark-outline-focus:theme(colors.white/15%)]',
]

export const TRIGGER_BUTTON_STYLES = {
  placeholder: 'block truncate opacity-50',
  value: 'block truncate',
}
