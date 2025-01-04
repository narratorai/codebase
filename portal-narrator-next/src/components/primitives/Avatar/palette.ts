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
  // Light
  '[--light-accent:theme(colors.transparent)]',
  '[--light-accent-hover:theme(colors.transparent)]',
  '[--light-accent-focus:theme(colors.slate.500)]',
  '[--light-outline:theme(colors.transparent)]',
  // Any
  '[--any-complement:theme(colors.slate.500)]',
  // Dark
  '[--dark-accent:theme(colors.transparent)]',
  '[--dark-accent-hover:theme(colors.transparent)]',
  '[--dark-accent-focus:theme(colors.slate.400)]',
  '[--dark-outline:theme(colors.transparent)]',
]

export const white = [
  // Light
  '[--light-accent:theme(colors.gray.600)]',
  '[--light-accent-hover:theme(colors.gray.800)]',
  '[--light-accent-focus:theme(colors.gray.800)]',
  '[--light-complement:theme(colors.white)]',
  '[--light-outline:theme(colors.white/20%)]',
  // Dark
  '[--dark-accent:theme(colors.gray.400)]',
  '[--dark-accent-hover:theme(colors.white)]',
  '[--dark-accent-focus:theme(colors.white)]',
  '[--dark-complement:theme(colors.gray.800)]',
  '[--dark-outline:theme(colors.black/20%)]',
]

export const slate = [
  // Light
  '[--light-accent:theme(colors.slate.500)]',
  '[--light-accent-hover:theme(colors.slate.500/90%)]',
  '[--light-accent-focus:theme(colors.slate.500)]',
  '[--light-outline:theme(colors.black/20%)]',
  // Any
  '[--any-complement:theme(colors.white)]',
  // Dark
  '[--dark-accent:theme(colors.slate.400)]',
  '[--dark-accent-hover:theme(colors.slate.400/90%)]',
  '[--dark-accent-focus:theme(colors.slate.400)]',
  '[--dark-outline:theme(colors.white/20%)]',
]

export const gray = [
  // Light
  '[--light-accent:theme(colors.gray.500)]',
  '[--light-accent-hover:theme(colors.gray.500/90%)]',
  '[--light-accent-focus:theme(colors.gray.500)]',
  '[--light-outline:theme(colors.black/20%)]',
  // Any
  '[--any-complement:theme(colors.white)]',
  // Dark
  '[--dark-accent:theme(colors.gray.400)]',
  '[--dark-accent-hover:theme(colors.gray.400/90%)]',
  '[--dark-accent-focus:theme(colors.gray.400)]',
  '[--dark-outline:theme(colors.white/20%)]',
]

export const zinc = [
  // Light
  '[--light-accent:theme(colors.zinc.600)]',
  '[--light-accent-hover:theme(colors.zinc.600/90%)]',
  '[--light-accent-focus:theme(colors.zinc.600)]',
  '[--light-outline:theme(colors.black/20%)]',
  // Any
  '[--any-complement:theme(colors.white)]',
  // Dark
  '[--dark-accent:theme(colors.zinc.500)]',
  '[--dark-accent-hover:theme(colors.zinc.500/90%)]',
  '[--dark-accent-focus:theme(colors.zinc.500)]',
  '[--dark-outline:theme(colors.white/20%)]',
]

export const neutral = [
  // Light
  '[--light-accent:theme(colors.neutral.600)]',
  '[--light-accent-hover:theme(colors.neutral.600/90%)]',
  '[--light-accent-focus:theme(colors.neutral.600)]',
  '[--light-outline:theme(colors.black/20%)]',
  // Any
  '[--any-complement:theme(colors.white)]',
  // Dark
  '[--dark-accent:theme(colors.neutral.500)]',
  '[--dark-accent-hover:theme(colors.neutral.500/90%)]',
  '[--dark-accent-focus:theme(colors.neutral.500)]',
  '[--dark-outline:theme(colors.white/20%)]',
]

export const stone = [
  // Light
  '[--light-accent:theme(colors.stone.600)]',
  '[--light-accent-hover:theme(colors.stone.600/90%)]',
  '[--light-accent-focus:theme(colors.stone.600)]',
  '[--light-outline:theme(colors.black/20%)]',
  // Any
  '[--any-complement:theme(colors.white)]',
  // Dark
  '[--dark-accent:theme(colors.stone.500)]',
  '[--dark-accent-hover:theme(colors.stone.500/90%)]',
  '[--dark-accent-focus:theme(colors.stone.500)]',
  '[--dark-outline:theme(colors.white/20%)]',
]

export const red = [
  // Light
  '[--light-accent:theme(colors.red.600)]',
  '[--light-accent-hover:theme(colors.red.600/90%)]',
  '[--light-accent-focus:theme(colors.red.600)]',
  '[--light-outline:theme(colors.black/20%)]',
  // Any
  '[--any-complement:theme(colors.white)]',
  // Dark
  '[--dark-accent:theme(colors.red.500)]',
  '[--dark-accent-hover:theme(colors.red.500/90%)]',
  '[--dark-accent-focus:theme(colors.red.500)]',
  '[--dark-outline:theme(colors.white/20%)]',
]

export const orange = [
  // Light
  '[--light-accent:theme(colors.orange.500)]',
  '[--light-accent-hover:theme(colors.orange.500/90%)]',
  '[--light-accent-focus:theme(colors.orange.500)]',
  '[--light-outline:theme(colors.black/20%)]',
  // Any
  '[--any-complement:theme(colors.white)]',
  // Dark
  '[--dark-accent:theme(colors.orange.400)]',
  '[--dark-accent-hover:theme(colors.orange.400/90%)]',
  '[--dark-accent-focus:theme(colors.orange.400)]',
  '[--dark-outline:theme(colors.white/20%)]',
]

export const amber = [
  // Light
  '[--light-accent:theme(colors.amber.400)]',
  '[--light-accent-hover:theme(colors.amber.400/75%)]',
  '[--light-accent-focus:theme(colors.amber.400)]',
  '[--light-outline:theme(colors.black/20%)]',
  // Any
  '[--any-complement:theme(colors.amber.950)]',
  // Dark
  '[--dark-accent:theme(colors.amber.300)]',
  '[--dark-accent-hover:theme(colors.amber.300/75%)]',
  '[--dark-accent-focus:theme(colors.amber.300)]',
  '[--dark-outline:theme(colors.black/30%)]',
]

export const yellow = [
  // Light
  '[--light-accent:theme(colors.yellow.300)]',
  '[--light-accent-hover:theme(colors.yellow.300/75%)]',
  '[--light-accent-focus:theme(colors.yellow.300)]',
  '[--light-outline:theme(colors.black/20%)]',
  // Any
  '[--any-complement:theme(colors.yellow.950)]',
  // Dark
  '[--dark-accent:theme(colors.yellow.200)]',
  '[--dark-accent-hover:theme(colors.yellow.200/75%)]',
  '[--dark-accent-focus:theme(colors.yellow.200)]',
  '[--dark-outline:theme(colors.black/30%)]',
]

export const lime = [
  // Light
  '[--light-accent:theme(colors.lime.300)]',
  '[--light-accent-hover:theme(colors.lime.300/75%)]',
  '[--light-accent-focus:theme(colors.lime.300)]',
  '[--light-outline:theme(colors.black/20%)]',
  // Any
  '[--any-complement:theme(colors.lime.950)]',
  // Dark
  '[--dark-accent:theme(colors.lime.200)]',
  '[--dark-accent-hover:theme(colors.lime.200/75%)]',
  '[--dark-accent-focus:theme(colors.lime.200)]',
  '[--dark-outline:theme(colors.black/30%)]',
]

export const green = [
  // Light
  '[--light-accent:theme(colors.green.600)]',
  '[--light-accent-hover:theme(colors.green.600/90%)]',
  '[--light-accent-focus:theme(colors.green.600)]',
  '[--light-outline:theme(colors.black/20%)]',
  // Any
  '[--any-complement:theme(colors.white)]',
  // Dark
  '[--dark-accent:theme(colors.green.500)]',
  '[--dark-accent-hover:theme(colors.green.500/90%)]',
  '[--dark-accent-focus:theme(colors.green.500)]',
  '[--dark-outline:theme(colors.white/20%)]',
]

export const emerald = [
  // Light
  '[--light-accent:theme(colors.emerald.600)]',
  '[--light-accent-hover:theme(colors.emerald.600/90%)]',
  '[--light-accent-focus:theme(colors.emerald.600)]',
  '[--light-outline:theme(colors.black/20%)]',
  // Any
  '[--any-complement:theme(colors.white)]',
  // Dark
  '[--dark-accent:theme(colors.emerald.500)]',
  '[--dark-accent-hover:theme(colors.emerald.500/90%)]',
  '[--dark-accent-focus:theme(colors.emerald.500)]',
  '[--dark-outline:theme(colors.white/20%)]',
]

export const teal = [
  // Light
  '[--light-accent:theme(colors.teal.600)]',
  '[--light-accent-hover:theme(colors.teal.600/90%)]',
  '[--light-accent-focus:theme(colors.teal.600)]',
  '[--light-outline:theme(colors.black/20%)]',
  // Any
  '[--any-complement:theme(colors.white)]',
  // Dark
  '[--dark-accent:theme(colors.teal.500)]',
  '[--dark-accent-hover:theme(colors.teal.500/90%)]',
  '[--dark-accent-focus:theme(colors.teal.500)]',
  '[--dark-outline:theme(colors.white/20%)]',
]

export const cyan = [
  // Light
  '[--light-accent:theme(colors.cyan.300)]',
  '[--light-accent-hover:theme(colors.cyan.300/75%)]',
  '[--light-accent-focus:theme(colors.cyan.300)]',
  '[--light-outline:theme(colors.black/20%)]',
  // Any
  '[--any-complement:theme(colors.cyan.950)]',
  // Dark
  '[--dark-accent:theme(colors.cyan.200)]',
  '[--dark-accent-hover:theme(colors.cyan.200/75%)]',
  '[--dark-accent-focus:theme(colors.cyan.200)]',
  '[--dark-outline:theme(colors.black/30%)]',
]

export const sky = [
  // Light
  '[--light-accent:theme(colors.sky.500)]',
  '[--light-accent-hover:theme(colors.sky.500/90%)]',
  '[--light-accent-focus:theme(colors.sky.500)]',
  '[--light-outline:theme(colors.black/20%)]',
  // Any
  '[--any-complement:theme(colors.white)]',
  // Dark
  '[--dark-accent:theme(colors.sky.400)]',
  '[--dark-accent-hover:theme(colors.sky.400/90%)]',
  '[--dark-accent-focus:theme(colors.sky.400)]',
  '[--dark-outline:theme(colors.white/20%)]',
]

export const blue = [
  // Light
  '[--light-accent:theme(colors.blue.600)]',
  '[--light-accent-hover:theme(colors.blue.600/90%)]',
  '[--light-accent-focus:theme(colors.blue.600)]',
  '[--light-outline:theme(colors.black/20%)]',
  // Any
  '[--any-complement:theme(colors.white)]',
  // Dark
  '[--dark-accent:theme(colors.blue.500)]',
  '[--dark-accent-hover:theme(colors.blue.500/90%)]',
  '[--dark-accent-focus:theme(colors.blue.500)]',
  '[--dark-outline:theme(colors.white/20%)]',
]

export const indigo = [
  // Light
  '[--light-accent:theme(colors.indigo.600)]',
  '[--light-accent-hover:theme(colors.indigo.600/90%)]',
  '[--light-accent-focus:theme(colors.indigo.600)]',
  '[--light-outline:theme(colors.black/20%)]',
  // Any
  '[--any-complement:theme(colors.white)]',
  // Dark
  '[--dark-accent:theme(colors.indigo.500)]',
  '[--dark-accent-hover:theme(colors.indigo.500/90%)]',
  '[--dark-accent-focus:theme(colors.indigo.500)]',
  '[--dark-outline:theme(colors.white/20%)]',
]

export const violet = [
  // Light
  '[--light-accent:theme(colors.violet.500)]',
  '[--light-accent-hover:theme(colors.violet.500/90%)]',
  '[--light-accent-focus:theme(colors.violet.500)]',
  '[--light-outline:theme(colors.black/20%)]',
  // Any
  '[--any-complement:theme(colors.white)]',
  // Dark
  '[--dark-accent:theme(colors.violet.400)]',
  '[--dark-accent-hover:theme(colors.violet.400/90%)]',
  '[--dark-accent-focus:theme(colors.violet.400)]',
  '[--dark-outline:theme(colors.white/20%)]',
]

export const purple = [
  // Light
  '[--light-accent:theme(colors.purple.500)]',
  '[--light-accent-hover:theme(colors.purple.500/90%)]',
  '[--light-accent-focus:theme(colors.purple.500)]',
  '[--light-outline:theme(colors.black/20%)]',
  // Any
  '[--any-complement:theme(colors.white)]',
  // Dark
  '[--dark-accent:theme(colors.purple.400)]',
  '[--dark-accent-hover:theme(colors.purple.400/90%)]',
  '[--dark-accent-focus:theme(colors.purple.400)]',
  '[--dark-outline:theme(colors.white/20%)]',
]

export const fuchsia = [
  // Light
  '[--light-accent:theme(colors.fuchsia.500)]',
  '[--light-accent-hover:theme(colors.fuchsia.500/90%)]',
  '[--light-accent-focus:theme(colors.fuchsia.500)]',
  '[--light-outline:theme(colors.black/20%)]',
  // Any
  '[--any-complement:theme(colors.white)]',
  // Dark
  '[--dark-accent:theme(colors.fuchsia.400)]',
  '[--dark-accent-hover:theme(colors.fuchsia.400/90%)]',
  '[--dark-accent-focus:theme(colors.fuchsia.400)]',
  '[--dark-outline:theme(colors.white/20%)]',
]

export const pink = [
  // Light
  '[--light-accent:theme(colors.pink.500)]',
  '[--light-accent-hover:theme(colors.pink.500/90%)]',
  '[--light-accent-focus:theme(colors.pink.500)]',
  '[--light-outline:theme(colors.black/20%)]',
  // Any
  '[--any-complement:theme(colors.white)]',
  // Dark
  '[--dark-accent:theme(colors.pink.400)]',
  '[--dark-accent-hover:theme(colors.pink.400/90%)]',
  '[--dark-accent-focus:theme(colors.pink.400)]',
  '[--dark-outline:theme(colors.white/20%)]',
]

export const rose = [
  // Light
  '[--light-accent:theme(colors.rose.500)]',
  '[--light-accent-hover:theme(colors.rose.500/90%)]',
  '[--light-accent-focus:theme(colors.rose.500)]',
  '[--light-outline:theme(colors.black/20%)]',
  // Any
  '[--any-complement:theme(colors.white)]',
  // Dark
  '[--dark-accent:theme(colors.rose.400)]',
  '[--dark-accent-hover:theme(colors.rose.400/90%)]',
  '[--dark-accent-focus:theme(colors.rose.400)]',
  '[--dark-outline:theme(colors.white/20%)]',
]
