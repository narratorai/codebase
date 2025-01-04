/**
 *
 * Color Variable Convention
 *
 * --{theme}-{feature}-{state?}
 *
 * theme: any | light | dark - two themes
 * feature: * - arbitrary dash-separated ('-') string
 * state?: hover | focus | disabled | active - possible states of the component
 *
 * Examples:
 *
 * --light-solid-accent-default - The light theme, solid accent color, in default state.
 * --dark-soft-accent-hover - The dark theme, soft accent color, in hover state.
 */

export const transparent = [
  // Light Solid
  '[--light-solid-accent:theme(colors.transparent)]',
  '[--light-solid-complement:theme(colors.zinc.700)]',

  // Light Soft
  '[--light-soft-accent:theme(colors.zinc.700)]',
  '[--light-soft-complement:theme(colors.transparent)]',

  // Dark Solid
  '[--dark-solid-accent:theme(colors.transparent)]',
  '[--dark-solid-complement:theme(colors.zinc.400)]',

  // Dark Soft
  '[--dark-soft-accent:theme(colors.zinc.400)]',
  '[--dark-soft-complement:theme(colors.transparent)]',
]

export const white = [
  // Light Solid
  '[--light-solid-accent:theme(colors.white)]',
  '[--light-solid-accent-hover:theme(colors.zinc.950/5%)]',
  '[--light-solid-accent-icon-hover:theme(colors.zinc.300/25%)]',
  '[--light-solid-accent-focus:theme(colors.zinc.950/10%)]',
  '[--light-solid-complement:theme(colors.zinc.950)]',

  // Dark Solid
  '[--dark-solid-accent:theme(colors.transparent)]',
  '[--dark-solid-accent-hover:theme(colors.white/10%)]',
  '[--dark-solid-accent-icon-hover:theme(colors.zinc.300/25%)]',
  '[--dark-solid-accent-focus:theme(colors.white/15%)]',
  '[--dark-solid-complement:theme(colors.white)]',

  // Light Soft
  '[--light-soft-accent:theme(colors.zinc.950)]',
  '[--light-soft-outline:theme(colors.zinc.950/10%)]',
  '[--light-soft-accent-focus:theme(colors.zinc.950/10%)]',
  '[--light-soft-complement:theme(colors.white)]',
  '[--light-soft-complement-hover:theme(colors.zinc.950/2.5%)]',

  // Dark Soft
  '[--dark-soft-accent:theme(colors.white)]',
  '[--dark-soft-outline:theme(colors.white/15%)]',
  '[--dark-soft-accent-focus:theme(colors.white/15%)]',
  '[--dark-soft-complement:theme(colors.transparent)]',
  '[--dark-soft-complement-hover:theme(colors.white/5%)]',
]

export const slate = [
  // Light Solid
  '[--light-solid-accent:theme(colors.slate.500)]',
  '[--light-solid-accent-hover:theme(colors.slate.500/90%)]',
  '[--light-solid-accent-icon-hover:theme(colors.slate.200/25%)]',
  '[--light-solid-accent-focus:theme(colors.slate.500)]',
  '[--light-solid-complement:theme(colors.white)]',

  // Dark Solid
  '[--dark-solid-accent:theme(colors.slate.400)]',
  '[--dark-solid-accent-hover:theme(colors.slate.400/90%)]',
  '[--dark-solid-accent-icon-hover:theme(colors.slate.200/25%)]',
  '[--dark-solid-accent-focus:theme(colors.slate.400)]',
  '[--dark-solid-complement:theme(colors.slate.950)]',

  // Light Soft
  '[--light-soft-accent:theme(colors.slate.700)]',
  '[--light-soft-accent-focus:theme(colors.slate.700)]',
  '[--light-soft-complement:theme(colors.slate.500/15%)]',
  '[--light-soft-complement-hover:theme(colors.slate.500/25%)]',

  // Dark Soft
  '[--dark-soft-accent:theme(colors.slate.400)]',
  '[--dark-soft-accent-focus:theme(colors.slate.400)]',
  '[--dark-soft-complement:theme(colors.slate.500/10%)]',
  '[--dark-soft-complement-hover:theme(colors.slate.500/20%)]',
]

export const gray = [
  // Light Solid
  '[--light-solid-accent:theme(colors.gray.500)]',
  '[--light-solid-accent-hover:theme(colors.gray.500/90%)]',
  '[--light-solid-accent-icon-hover:theme(colors.gray.200/25%)]',
  '[--light-solid-accent-focus:theme(colors.gray.500)]',
  '[--light-solid-complement:theme(colors.white)]',

  // Dark Solid
  '[--dark-solid-accent:theme(colors.gray.400)]',
  '[--dark-solid-accent-hover:theme(colors.gray.400/90%)]',
  '[--dark-solid-accent-icon-hover:theme(colors.gray.200/25%)]',
  '[--dark-solid-accent-focus:theme(colors.gray.400)]',
  '[--dark-solid-complement:theme(colors.gray.950)]',

  // Light Soft
  '[--light-soft-accent:theme(colors.gray.700)]',
  '[--light-soft-accent-focus:theme(colors.gray.700)]',
  '[--light-soft-complement:theme(colors.gray.500/15%)]',
  '[--light-soft-complement-hover:theme(colors.gray.500/25%)]',

  // Dark Soft
  '[--dark-soft-accent:theme(colors.gray.400)]',
  '[--dark-soft-accent-focus:theme(colors.gray.400)]',
  '[--dark-soft-complement:theme(colors.gray.500/10%)]',
  '[--dark-soft-complement-hover:theme(colors.gray.500/20%)]',
]

export const zinc = [
  // Light Solid
  '[--light-solid-accent:theme(colors.zinc.600)]',
  '[--light-solid-accent-hover:theme(colors.zinc.600/90%)]',
  '[--light-solid-accent-icon-hover:theme(colors.zinc.300/25%)]',
  '[--light-solid-accent-focus:theme(colors.zinc.600)]',

  // Any Solid
  '[--any-solid-complement:theme(colors.white)]',

  // Dark Solid
  '[--dark-solid-accent:theme(colors.zinc.500)]',
  '[--dark-solid-accent-hover:theme(colors.zinc.500/90%)]',
  '[--dark-solid-accent-icon-hover:theme(colors.zinc.700/25%)]',
  '[--dark-solid-accent-focus:theme(colors.zinc.500)]',

  // Light Soft
  '[--light-soft-accent:theme(colors.zinc.700)]',
  '[--light-soft-accent-focus:theme(colors.zinc.700)]',
  '[--light-soft-complement:theme(colors.zinc.500/15%)]',
  '[--light-soft-complement-hover:theme(colors.zinc.500/25%)]',

  // Dark Soft
  '[--dark-soft-accent:theme(colors.zinc.400)]',
  '[--dark-soft-accent-focus:theme(colors.zinc.400)]',
  '[--dark-soft-complement:theme(colors.zinc.500/10%)]',
  '[--dark-soft-complement-hover:theme(colors.zinc.500/20%)]',
]

export const neutral = [
  // Light Solid
  '[--light-solid-accent:theme(colors.neutral.600)]',
  '[--light-solid-accent-hover:theme(colors.neutral.600/90%)]',
  '[--light-solid-accent-icon-hover:theme(colors.neutral.300/25%)]',
  '[--light-solid-accent-focus:theme(colors.neutral.600)]',

  // Any Solid
  '[--any-solid-complement:theme(colors.white)]',

  // Dark Solid
  '[--dark-solid-accent:theme(colors.neutral.500)]',
  '[--dark-solid-accent-hover:theme(colors.neutral.500/90%)]',
  '[--dark-solid-accent-icon-hover:theme(colors.neutral.700/25%)]',
  '[--dark-solid-accent-focus:theme(colors.neutral.500)]',

  // Light Soft
  '[--light-soft-accent:theme(colors.neutral.700)]',
  '[--light-soft-accent-focus:theme(colors.neutral.700)]',
  '[--light-soft-complement:theme(colors.neutral.500/15%)]',
  '[--light-soft-complement-hover:theme(colors.neutral.500/25%)]',

  // Dark Soft
  '[--dark-soft-accent:theme(colors.neutral.400)]',
  '[--dark-soft-accent-focus:theme(colors.neutral.400)]',
  '[--dark-soft-complement:theme(colors.neutral.500/10%)]',
  '[--dark-soft-complement-hover:theme(colors.neutral.500/20%)]',
]

export const stone = [
  // Light Solid
  '[--light-solid-accent:theme(colors.stone.600)]',
  '[--light-solid-accent-hover:theme(colors.stone.600/90%)]',
  '[--light-solid-accent-icon-hover:theme(colors.stone.300/25%)]',
  '[--light-solid-accent-focus:theme(colors.stone.600)]',

  // Any Solid
  '[--any-solid-complement:theme(colors.white)]',

  // Dark Solid
  '[--dark-solid-accent:theme(colors.stone.500)]',
  '[--dark-solid-accent-hover:theme(colors.stone.500/90%)]',
  '[--dark-solid-accent-icon-hover:theme(colors.stone.700/25%)]',
  '[--dark-solid-accent-focus:theme(colors.stone.500)]',

  // Light Soft
  '[--light-soft-accent:theme(colors.stone.700)]',
  '[--light-soft-accent-focus:theme(colors.stone.700)]',
  '[--light-soft-complement:theme(colors.stone.500/15%)]',
  '[--light-soft-complement-hover:theme(colors.stone.500/25%)]',

  // Dark Soft
  '[--dark-soft-accent:theme(colors.stone.400)]',
  '[--dark-soft-accent-focus:theme(colors.stone.400)]',
  '[--dark-soft-complement:theme(colors.stone.500/10%)]',
  '[--dark-soft-complement-hover:theme(colors.stone.500/20%)]',
]

export const red = [
  // Light Solid
  '[--light-solid-accent:theme(colors.red.600)]',
  '[--light-solid-accent-hover:theme(colors.red.600/90%)]',
  '[--light-solid-accent-icon-hover:theme(colors.red.300/25%)]',
  '[--light-solid-accent-focus:theme(colors.red.600)]',

  // Any Solid
  '[--any-solid-complement:theme(colors.white)]',

  // Dark Solid
  '[--dark-solid-accent:theme(colors.red.500)]',
  '[--dark-solid-accent-hover:theme(colors.red.500/90%)]',
  '[--dark-solid-accent-icon-hover:theme(colors.red.700/25%)]',
  '[--dark-solid-accent-focus:theme(colors.red.500)]',

  // Light Soft
  '[--light-soft-accent:theme(colors.red.700)]',
  '[--light-soft-accent-focus:theme(colors.red.700)]',
  '[--light-soft-complement:theme(colors.red.500/15%)]',
  '[--light-soft-complement-hover:theme(colors.red.500/25%)]',

  // Dark Soft
  '[--dark-soft-accent:theme(colors.red.400)]',
  '[--dark-soft-accent-focus:theme(colors.red.400)]',
  '[--dark-soft-complement:theme(colors.red.500/10%)]',
  '[--dark-soft-complement-hover:theme(colors.red.500/20%)]',
]

export const orange = [
  // Light Solid
  '[--light-solid-accent:theme(colors.orange.500)]',
  '[--light-solid-accent-hover:theme(colors.orange.500/90%)]',
  '[--light-solid-accent-icon-hover:theme(colors.orange.200/25%)]',
  '[--light-solid-accent-focus:theme(colors.orange.500)]',
  '[--light-solid-complement:theme(colors.white)]',

  // Dark Solid
  '[--dark-solid-accent:theme(colors.orange.400)]',
  '[--dark-solid-accent-hover:theme(colors.orange.400/90%)]',
  '[--dark-solid-accent-icon-hover:theme(colors.orange.200/25%)]',
  '[--dark-solid-accent-focus:theme(colors.orange.400)]',
  '[--dark-solid-complement:theme(colors.orange.950)]',

  // Light Soft
  '[--light-soft-accent:theme(colors.orange.700)]',
  '[--light-soft-accent-focus:theme(colors.orange.700)]',
  '[--light-soft-complement:theme(colors.orange.500/15%)]',
  '[--light-soft-complement-hover:theme(colors.orange.500/25%)]',

  // Dark Soft
  '[--dark-soft-accent:theme(colors.orange.400)]',
  '[--dark-soft-accent-focus:theme(colors.orange.400)]',
  '[--dark-soft-complement:theme(colors.orange.500/10%)]',
  '[--dark-soft-complement-hover:theme(colors.orange.500/20%)]',
]

export const amber = [
  // Light Solid
  '[--light-solid-accent:theme(colors.amber.400)]',
  '[--light-solid-accent-hover:theme(colors.amber.400/75%)]',
  '[--light-solid-accent-icon-hover:theme(colors.amber.700/25%)]',
  '[--light-solid-accent-focus:theme(colors.amber.400)]',

  // Any Solid
  '[--any-solid-complement:theme(colors.amber.950)]',

  // Dark Solid
  '[--dark-solid-accent:theme(colors.amber.300)]',
  '[--dark-solid-accent-hover:theme(colors.amber.300/75%)]',
  '[--dark-solid-accent-icon-hover:theme(colors.amber.700/25%)]',
  '[--dark-solid-accent-focus:theme(colors.amber.300)]',

  // Light Soft
  '[--light-soft-accent:theme(colors.amber.700)]',
  '[--light-soft-accent-focus:theme(colors.amber.700)]',
  '[--light-soft-complement:theme(colors.amber.400/20%)]',
  '[--light-soft-complement-hover:theme(colors.amber.400/30%)]',

  // Dark Soft
  '[--dark-soft-accent:theme(colors.amber.400)]',
  '[--dark-soft-accent-focus:theme(colors.amber.400)]',
  '[--dark-soft-complement:theme(colors.amber.400/10%)]',
  '[--dark-soft-complement-hover:theme(colors.amber.400/15%)]',
]

export const yellow = [
  // Light Solid
  '[--light-solid-accent:theme(colors.yellow.300)]',
  '[--light-solid-accent-hover:theme(colors.yellow.300/75%)]',
  '[--light-solid-accent-icon-hover:theme(colors.yellow.600/25%)]',
  '[--light-solid-accent-focus:theme(colors.yellow.300)]',

  // Any Solid
  '[--any-solid-complement:theme(colors.yellow.950)]',

  // Dark Solid
  '[--dark-solid-accent:theme(colors.yellow.200)]',
  '[--dark-solid-accent-hover:theme(colors.yellow.200/75%)]',
  '[--dark-solid-accent-icon-hover:theme(colors.yellow.600/25%)]',
  '[--dark-solid-accent-focus:theme(colors.yellow.200)]',

  // Light Soft
  '[--light-soft-accent:theme(colors.yellow.700)]',
  '[--light-soft-accent-focus:theme(colors.yellow.700)]',
  '[--light-soft-complement:theme(colors.yellow.400/20%)]',
  '[--light-soft-complement-hover:theme(colors.yellow.400/30%)]',

  // Dark Soft
  '[--dark-soft-accent:theme(colors.yellow.300)]',
  '[--dark-soft-accent-focus:theme(colors.yellow.300)]',
  '[--dark-soft-complement:theme(colors.yellow.400/10%)]',
  '[--dark-soft-complement-hover:theme(colors.yellow.400/15%)]',
]

export const lime = [
  // Light Solid
  '[--light-solid-accent:theme(colors.lime.300)]',
  '[--light-solid-accent-hover:theme(colors.lime.300/75%)]',
  '[--light-solid-accent-icon-hover:theme(colors.lime.600/25%)]',
  '[--light-solid-accent-focus:theme(colors.lime.300)]',

  // Any Solid
  '[--any-solid-complement:theme(colors.lime.950)]',

  // Dark Solid
  '[--dark-solid-accent:theme(colors.lime.200)]',
  '[--dark-solid-accent-hover:theme(colors.lime.200/75%)]',
  '[--dark-solid-accent-icon-hover:theme(colors.lime.600/25%)]',
  '[--dark-solid-accent-focus:theme(colors.lime.200)]',

  // Light Soft
  '[--light-soft-accent:theme(colors.lime.700)]',
  '[--light-soft-accent-focus:theme(colors.lime.700)]',
  '[--light-soft-complement:theme(colors.lime.400/20%)]',
  '[--light-soft-complement-hover:theme(colors.lime.400/30%)]',

  // Dark Soft
  '[--dark-soft-accent:theme(colors.lime.300)]',
  '[--dark-soft-accent-focus:theme(colors.lime.300)]',
  '[--dark-soft-complement:theme(colors.lime.400/10%)]',
  '[--dark-soft-complement-hover:theme(colors.lime.400/15%)]',
]

export const green = [
  // Light Solid
  '[--light-solid-accent:theme(colors.green.600)]',
  '[--light-solid-accent-hover:theme(colors.green.600/90%)]',
  '[--light-solid-accent-icon-hover:theme(colors.green.300/25%)]',
  '[--light-solid-accent-focus:theme(colors.green.600)]',

  // Any Solid
  '[--any-solid-complement:theme(colors.white)]',

  // Dark Solid
  '[--dark-solid-accent:theme(colors.green.500)]',
  '[--dark-solid-accent-hover:theme(colors.green.500/90%)]',
  '[--dark-solid-accent-icon-hover:theme(colors.green.700/25%)]',
  '[--dark-solid-accent-focus:theme(colors.green.500)]',

  // Light Soft
  '[--light-soft-accent:theme(colors.green.700)]',
  '[--light-soft-accent-focus:theme(colors.green.700)]',
  '[--light-soft-complement:theme(colors.green.500/15%)]',
  '[--light-soft-complement-hover:theme(colors.green.500/25%)]',

  // Dark Soft
  '[--dark-soft-accent:theme(colors.green.400)]',
  '[--dark-soft-accent-focus:theme(colors.green.400)]',
  '[--dark-soft-complement:theme(colors.green.500/10%)]',
  '[--dark-soft-complement-hover:theme(colors.green.500/20%)]',
]

export const emerald = [
  // Light Solid
  '[--light-solid-accent:theme(colors.emerald.600)]',
  '[--light-solid-accent-hover:theme(colors.emerald.600/90%)]',
  '[--light-solid-accent-icon-hover:theme(colors.emerald.300/25%)]',
  '[--light-solid-accent-focus:theme(colors.emerald.600)]',

  // Any Solid
  '[--any-solid-complement:theme(colors.white)]',

  // Dark Solid
  '[--dark-solid-accent:theme(colors.emerald.500)]',
  '[--dark-solid-accent-hover:theme(colors.emerald.500/90%)]',
  '[--dark-solid-accent-icon-hover:theme(colors.emerald.700/25%)]',
  '[--dark-solid-accent-focus:theme(colors.emerald.500)]',

  // Light Soft
  '[--light-soft-accent:theme(colors.emerald.700)]',
  '[--light-soft-accent-focus:theme(colors.emerald.700)]',
  '[--light-soft-complement-hover:theme(colors.emerald.500/25%)]',
  '[--light-soft-complement:theme(colors.emerald.500/15%)]',

  // Dark Soft
  '[--dark-soft-accent:theme(colors.emerald.400)]',
  '[--dark-soft-accent-focus:theme(colors.emerald.400)]',
  '[--dark-soft-complement:theme(colors.emerald.500/10%)]',
  '[--dark-soft-complement-hover:theme(colors.emerald.500/20%)]',
]

export const teal = [
  // Light Solid
  '[--light-solid-accent:theme(colors.teal.600)]',
  '[--light-solid-accent-hover:theme(colors.teal.600/90%)]',
  '[--light-solid-accent-icon-hover:theme(colors.teal.300/25%)]',
  '[--light-solid-accent-focus:theme(colors.teal.600)]',

  // Any Solid
  '[--any-solid-complement:theme(colors.white)]',

  // Dark Solid
  '[--dark-solid-accent:theme(colors.teal.500)]',
  '[--dark-solid-accent-hover:theme(colors.teal.500/90%)]',
  '[--dark-solid-accent-icon-hover:theme(colors.teal.700/25%)]',
  '[--dark-solid-accent-focus:theme(colors.teal.500)]',

  // Light Soft
  '[--light-soft-accent:theme(colors.teal.700)]',
  '[--light-soft-accent-focus:theme(colors.teal.700)]',
  '[--light-soft-complement:theme(colors.teal.500/15%)]',
  '[--light-soft-complement-hover:theme(colors.teal.500/25%)]',

  // Dark Soft
  '[--dark-soft-accent:theme(colors.teal.300)]',
  '[--dark-soft-accent-focus:theme(colors.teal.300)]',
  '[--dark-soft-complement:theme(colors.teal.500/10%)]',
  '[--dark-soft-complement-hover:theme(colors.teal.500/20%)]',
]

export const cyan = [
  // Light Solid
  '[--light-solid-accent:theme(colors.cyan.300)]',
  '[--light-solid-accent-hover:theme(colors.cyan.300/75%)]',
  '[--light-solid-accent-icon-hover:theme(colors.cyan.600/25%)]',
  '[--light-solid-accent-focus:theme(colors.cyan.300)]',

  // Any Solid
  '[--any-solid-complement:theme(colors.cyan.950)]',

  // Dark Solid
  '[--dark-solid-accent:theme(colors.cyan.200)]',
  '[--dark-solid-accent-hover:theme(colors.cyan.200/75%)]',
  '[--dark-solid-accent-icon-hover:theme(colors.cyan.600/25%)]',
  '[--dark-solid-accent-focus:theme(colors.cyan.200)]',

  // Light Soft
  '[--light-soft-accent:theme(colors.cyan.700)]',
  '[--light-soft-accent-focus:theme(colors.cyan.700)]',
  '[--light-soft-complement:theme(colors.cyan.400/20%)]',
  '[--light-soft-complement-hover:theme(colors.cyan.400/30%)]',

  // Dark Soft
  '[--dark-soft-accent:theme(colors.cyan.300)]',
  '[--dark-soft-accent-focus:theme(colors.cyan.300)]',
  '[--dark-soft-complement:theme(colors.cyan.400/10%)]',
  '[--dark-soft-complement-hover:theme(colors.cyan.400/15%)]',
]

export const sky = [
  // Light Solid
  '[--light-solid-accent:theme(colors.sky.500)]',
  '[--light-solid-accent-hover:theme(colors.sky.500/90%)]',
  '[--light-solid-accent-icon-hover:theme(colors.sky.200/25%)]',
  '[--light-solid-accent-focus:theme(colors.sky.500)]',
  '[--light-solid-complement:theme(colors.white)]',

  // Dark Solid
  '[--dark-solid-accent:theme(colors.sky.400)]',
  '[--dark-solid-accent-hover:theme(colors.sky.400/90%)]',
  '[--dark-solid-accent-icon-hover:theme(colors.sky.200/25%)]',
  '[--dark-solid-accent-focus:theme(colors.sky.400)]',
  '[--dark-solid-complement:theme(colors.sky.950)]',

  // Light Soft
  '[--light-soft-accent:theme(colors.sky.700)]',
  '[--light-soft-accent-focus:theme(colors.sky.700)]',
  '[--light-soft-complement:theme(colors.sky.500/15%)]',
  '[--light-soft-complement-hover:theme(colors.sky.500/25%)]',

  // Dark Soft
  '[--dark-soft-accent:theme(colors.sky.300)]',
  '[--dark-soft-accent-focus:theme(colors.sky.300)]',
  '[--dark-soft-complement:theme(colors.sky.500/10%)]',
  '[--dark-soft-complement-hover:theme(colors.sky.500/20%)]',
]

export const blue = [
  // Light Solid
  '[--light-solid-accent:theme(colors.blue.600)]',
  '[--light-solid-accent-hover:theme(colors.blue.600/90%)]',
  '[--light-solid-accent-icon-hover:theme(colors.blue.300/25%)]',
  '[--light-solid-accent-focus:theme(colors.blue.600)]',

  // Any Solid
  '[--any-solid-complement:theme(colors.white)]',

  // Dark Solid
  '[--dark-solid-accent:theme(colors.blue.500)]',
  '[--dark-solid-accent-hover:theme(colors.blue.500/90%)]',
  '[--dark-solid-accent-icon-hover:theme(colors.blue.700/25%)]',
  '[--dark-solid-accent-focus:theme(colors.blue.500)]',

  // Light Soft
  '[--light-soft-accent:theme(colors.blue.700)]',
  '[--light-soft-accent-focus:theme(colors.blue.700)]',
  '[--light-soft-complement:theme(colors.blue.500/15%)]',
  '[--light-soft-complement-hover:theme(colors.blue.500/25%)]',

  // Dark Soft
  '[--dark-soft-accent:theme(colors.blue.400)]',
  '[--dark-soft-accent-focus:theme(colors.blue.400)]',
  '[--dark-soft-complement:theme(colors.blue.500/15%)]',
  '[--dark-soft-complement-hover:theme(colors.blue.500/25%)]',
]

export const indigo = [
  // Light Solid
  '[--light-solid-accent:theme(colors.indigo.600)]',
  '[--light-solid-accent-hover:theme(colors.indigo.600/90%)]',
  '[--light-solid-accent-icon-hover:theme(colors.indigo.300/25%)]',
  '[--light-solid-accent-focus:theme(colors.indigo.600)]',

  // Any Solid
  '[--any-solid-complement:theme(colors.white)]',

  // Dark Solid
  '[--dark-solid-accent:theme(colors.indigo.500)]',
  '[--dark-solid-accent-hover:theme(colors.indigo.500/90%)]',
  '[--dark-solid-accent-icon-hover:theme(colors.indigo.700/25%)]',
  '[--dark-solid-accent-focus:theme(colors.indigo.500)]',

  // Light Soft
  '[--light-soft-accent:theme(colors.indigo.700)]',
  '[--light-soft-accent-focus:theme(colors.indigo.700)]',
  '[--light-soft-complement:theme(colors.indigo.500/15%)]',
  '[--light-soft-complement-hover:theme(colors.indigo.500/25%)]',

  // Dark Soft
  '[--dark-soft-accent:theme(colors.indigo.400)]',
  '[--dark-soft-accent-focus:theme(colors.indigo.400)]',
  '[--dark-soft-complement:theme(colors.indigo.500/15%)]',
  '[--dark-soft-complement-hover:theme(colors.indigo.500/20%)]',
]

export const violet = [
  // Light Solid
  '[--light-solid-accent:theme(colors.violet.500)]',
  '[--light-solid-accent-hover:theme(colors.violet.500/90%)]',
  '[--light-solid-accent-icon-hover:theme(colors.violet.200/25%)]',
  '[--light-solid-accent-focus:theme(colors.violet.500)]',
  '[--light-solid-complement:theme(colors.white)]',

  // Dark Solid
  '[--dark-solid-accent:theme(colors.violet.400)]',
  '[--dark-solid-accent-hover:theme(colors.violet.400/90%)]',
  '[--dark-solid-accent-icon-hover:theme(colors.violet.200/25%)]',
  '[--dark-solid-accent-focus:theme(colors.violet.400)]',
  '[--dark-solid-complement:theme(colors.violet.950)]',

  // Light Soft
  '[--light-soft-accent:theme(colors.violet.700)]',
  '[--light-soft-accent-focus:theme(colors.violet.700)]',
  '[--light-soft-complement:theme(colors.violet.500/15%)]',
  '[--light-soft-complement-hover:theme(colors.violet.500/25%)]',

  // Dark Soft
  '[--dark-soft-accent:theme(colors.violet.400)]',
  '[--dark-soft-accent-focus:theme(colors.violet.400)]',
  '[--dark-soft-complement:theme(colors.violet.500/15%)]',
  '[--dark-soft-complement-hover:theme(colors.violet.500/20%)]',
]

export const purple = [
  // Light Solid
  '[--light-solid-accent:theme(colors.purple.500)]',
  '[--light-solid-accent-hover:theme(colors.purple.500/90%)]',
  '[--light-solid-accent-icon-hover:theme(colors.purple.200/25%)]',
  '[--light-solid-accent-focus:theme(colors.purple.500)]',
  '[--light-solid-complement:theme(colors.white)]',

  // Dark Solid
  '[--dark-solid-accent:theme(colors.purple.400)]',
  '[--dark-solid-accent-hover:theme(colors.purple.400/90%)]',
  '[--dark-solid-accent-icon-hover:theme(colors.purple.200/25%)]',
  '[--dark-solid-accent-focus:theme(colors.purple.400)]',
  '[--dark-solid-complement:theme(colors.purple.950)]',

  // Light Soft
  '[--light-soft-accent:theme(colors.purple.700)]',
  '[--light-soft-accent-focus:theme(colors.purple.700)]',
  '[--light-soft-complement:theme(colors.purple.500/15%)]',
  '[--light-soft-complement-hover:theme(colors.purple.500/25%)]',

  // Dark Soft
  '[--dark-soft-accent:theme(colors.purple.400)]',
  '[--dark-soft-accent-focus:theme(colors.purple.400)]',
  '[--dark-soft-complement:theme(colors.purple.500/15%)]',
  '[--dark-soft-complement-hover:theme(colors.purple.500/20%)]',
]

export const fuchsia = [
  // Light Solid
  '[--light-solid-accent:theme(colors.fuchsia.500)]',
  '[--light-solid-accent-hover:theme(colors.fuchsia.500/90%)]',
  '[--light-solid-accent-icon-hover:theme(colors.fuchsia.200/25%)]',
  '[--light-solid-accent-focus:theme(colors.fuchsia.500)]',
  '[--light-solid-complement:theme(colors.white)]',

  // Dark Solid
  '[--dark-solid-accent:theme(colors.fuchsia.400)]',
  '[--dark-solid-accent-hover:theme(colors.fuchsia.400/90%)]',
  '[--dark-solid-accent-icon-hover:theme(colors.fuchsia.200/25%)]',
  '[--dark-solid-accent-focus:theme(colors.fuchsia.400)]',
  '[--dark-solid-complement:theme(colors.fuchsia.950)]',

  // Light Soft
  '[--light-soft-accent:theme(colors.fuchsia.700)]',
  '[--light-soft-accent-focus:theme(colors.fuchsia.700)]',
  '[--light-soft-complement:theme(colors.fuchsia.400/15%)]',
  '[--light-soft-complement-hover:theme(colors.fuchsia.400/25%)]',

  // Dark Soft
  '[--dark-soft-accent:theme(colors.fuchsia.400)]',
  '[--dark-soft-accent-focus:theme(colors.fuchsia.400)]',
  '[--dark-soft-complement:theme(colors.fuchsia.400/10%)]',
  '[--dark-soft-complement-hover:theme(colors.fuchsia.400/20%)]',
]

export const pink = [
  // Light Solid
  '[--light-solid-accent:theme(colors.pink.500)]',
  '[--light-solid-accent-hover:theme(colors.pink.500/90%)]',
  '[--light-solid-accent-icon-hover:theme(colors.pink.200/25%)]',
  '[--light-solid-accent-focus:theme(colors.pink.500)]',
  '[--light-solid-complement:theme(colors.white)]',

  // Dark Solid
  '[--dark-solid-accent:theme(colors.pink.400)]',
  '[--dark-solid-accent-hover:theme(colors.pink.400/90%)]',
  '[--dark-solid-accent-icon-hover:theme(colors.pink.200/25%)]',
  '[--dark-solid-accent-focus:theme(colors.pink.400)]',
  '[--dark-solid-complement:theme(colors.pink.950)]',

  // Light Soft
  '[--light-soft-accent:theme(colors.pink.700)]',
  '[--light-soft-accent-focus:theme(colors.pink.700)]',
  '[--light-soft-complement:theme(colors.pink.400/15%)]',
  '[--light-soft-complement-hover:theme(colors.pink.400/25%)]',

  // Dark Soft
  '[--dark-soft-accent:theme(colors.pink.400)]',
  '[--dark-soft-accent-focus:theme(colors.pink.400)]',
  '[--dark-soft-complement:theme(colors.pink.400/10%)]',
  '[--dark-soft-complement-hover:theme(colors.pink.400/20%)]',
]

export const rose = [
  // Light Solid
  '[--light-solid-accent:theme(colors.rose.500)]',
  '[--light-solid-accent-hover:theme(colors.rose.500/90%)]',
  '[--light-solid-accent-icon-hover:theme(colors.rose.200/25%)]',
  '[--light-solid-accent-focus:theme(colors.rose.500)]',
  '[--light-solid-complement:theme(colors.white)]',

  // Dark Solid
  '[--dark-solid-accent:theme(colors.rose.400)]',
  '[--dark-solid-accent-hover:theme(colors.rose.400/90%)]',
  '[--dark-solid-accent-icon-hover:theme(colors.rose.200/25%)]',
  '[--dark-solid-accent-focus:theme(colors.rose.400)]',
  '[--dark-solid-complement:theme(colors.rose.950)]',

  // Light Soft
  '[--light-soft-accent:theme(colors.rose.700)]',
  '[--light-soft-accent-focus:theme(colors.rose.700)]',
  '[--light-soft-complement:theme(colors.rose.400/15%)]',
  '[--light-soft-complement-hover:theme(colors.rose.400/25%)]',

  // Dark Soft
  '[--dark-soft-accent:theme(colors.rose.400)]',
  '[--dark-soft-accent-focus:theme(colors.rose.400)]',
  '[--dark-soft-complement:theme(colors.rose.400/10%)]',
  '[--dark-soft-complement-hover:theme(colors.rose.400/20%)]',
]
