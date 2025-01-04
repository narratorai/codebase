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
  '[--light-base:theme(colors.transparent)]',
  '[--light-accent:theme(colors.transparent)]',
  '[--light-decoration:theme(colors.transparent/50%)]',
  '[--light-decoration-hover:theme(colors.transparent)]',
  '[--light-border:theme(colors.transparent/20%)]',
  '[--light-background:theme(colors.transparent/5%)]',
  // Dark
  '[--dark-base:theme(colors.transparent)]',
  '[--dark-accent:theme(colors.transparent)]',
  '[--dark-decoration:theme(colors.transparent/50%)]',
  '[--dark-decoration-hover:theme(colors.transparent)]',
  '[--dark-border:theme(colors.transparent/20%)]',
  '[--dark-background:theme(colors.transparent/5%)]',
]

export const white = [
  // Light
  '[--light-base:theme(colors.white)]',
  '[--light-accent:theme(colors.white)]',
  '[--light-decoration:theme(colors.white/50%)]',
  '[--light-decoration-hover:theme(colors.white)]',
  '[--light-border:theme(colors.white/20%)]',
  '[--light-background:theme(colors.white/5%)]',
  // Dark
  '[--dark-base:theme(colors.white)]',
  '[--dark-accent:theme(colors.white)]',
  '[--dark-decoration:theme(colors.white/50%)]',
  '[--dark-decoration-hover:theme(colors.white)]',
  '[--dark-border:theme(colors.white/20%)]',
  '[--dark-background:theme(colors.white/5%)]',
]

export const slate = [
  // Light
  '[--light-base:theme(colors.slate.600)]',
  '[--light-accent:theme(colors.slate.800)]',
  '[--light-decoration:theme(colors.slate.800/50%)]',
  '[--light-decoration-hover:theme(colors.slate.800)]',
  '[--light-border:theme(colors.slate.800/20%)]',
  '[--light-background:theme(colors.slate.800/5%)]',
  // Dark
  '[--dark-base:theme(colors.slate.400)]',
  '[--dark-accent:theme(colors.slate.300)]',
  '[--dark-decoration:theme(colors.slate.300/50%)]',
  '[--dark-decoration-hover:theme(colors.slate.300)]',
  '[--dark-border:theme(colors.slate.300/20%)]',
  '[--dark-background:theme(colors.slate.300/5%)]',
]

export const gray = [
  // Light
  '[--light-base:theme(colors.gray.600)]',
  '[--light-accent:theme(colors.gray.800)]',
  '[--light-decoration:theme(colors.gray.800/50%)]',
  '[--light-decoration-hover:theme(colors.gray.800)]',
  '[--light-border:theme(colors.gray.800/20%)]',
  '[--light-background:theme(colors.gray.800/5%)]',
  // Dark
  '[--dark-base:theme(colors.gray.400)]',
  '[--dark-accent:theme(colors.gray.300)]',
  '[--dark-decoration:theme(colors.gray.300/50%)]',
  '[--dark-decoration-hover:theme(colors.gray.300)]',
  '[--dark-border:theme(colors.gray.300/20%)]',
  '[--dark-background:theme(colors.gray.300/5%)]',
]

export const zinc = [
  // Light
  '[--light-base:theme(colors.zinc.600)]',
  '[--light-accent:theme(colors.zinc.800)]',
  '[--light-decoration:theme(colors.zinc.800/50%)]',
  '[--light-decoration-hover:theme(colors.zinc.800)]',
  '[--light-border:theme(colors.zinc.800/20%)]',
  '[--light-background:theme(colors.zinc.800/5%)]',
  // Dark
  '[--dark-base:theme(colors.zinc.400)]',
  '[--dark-accent:theme(colors.zinc.300)]',
  '[--dark-decoration:theme(colors.zinc.300/50%)]',
  '[--dark-decoration-hover:theme(colors.zinc.300)]',
  '[--dark-border:theme(colors.zinc.300/20%)]',
  '[--dark-background:theme(colors.zinc.300/5%)]',
]

export const neutral = [
  // Light
  '[--light-base:theme(colors.neutral.600)]',
  '[--light-accent:theme(colors.neutral.800)]',
  '[--light-decoration:theme(colors.neutral.800/50%)]',
  '[--light-decoration-hover:theme(colors.neutral.800)]',
  '[--light-border:theme(colors.neutral.800/20%)]',
  '[--light-background:theme(colors.neutral.800/5%)]',
  // Dark
  '[--dark-base:theme(colors.neutral.400)]',
  '[--dark-accent:theme(colors.neutral.300)]',
  '[--dark-decoration:theme(colors.neutral.300/50%)]',
  '[--dark-decoration-hover:theme(colors.neutral.300)]',
  '[--dark-border:theme(colors.neutral.300/20%)]',
  '[--dark-background:theme(colors.neutral.300/5%)]',
]

export const stone = [
  // Light
  '[--light-base:theme(colors.stone.600)]',
  '[--light-accent:theme(colors.stone.800)]',
  '[--light-decoration:theme(colors.stone.800/50%)]',
  '[--light-decoration-hover:theme(colors.stone.800)]',
  '[--light-border:theme(colors.stone.800/20%)]',
  '[--light-background:theme(colors.stone.800/5%)]',
  // Dark
  '[--dark-base:theme(colors.stone.400)]',
  '[--dark-accent:theme(colors.stone.300)]',
  '[--dark-decoration:theme(colors.stone.300/50%)]',
  '[--dark-decoration-hover:theme(colors.stone.300)]',
  '[--dark-border:theme(colors.stone.300/20%)]',
  '[--dark-background:theme(colors.stone.300/5%)]',
]

export const red = [
  // Light
  '[--light-base:theme(colors.red.600)]',
  '[--light-accent:theme(colors.red.800)]',
  '[--light-decoration:theme(colors.red.800/50%)]',
  '[--light-decoration-hover:theme(colors.red.800)]',
  '[--light-border:theme(colors.red.800/20%)]',
  '[--light-background:theme(colors.red.800/5%)]',
  // Dark
  '[--dark-base:theme(colors.red.400)]',
  '[--dark-accent:theme(colors.red.300)]',
  '[--dark-decoration:theme(colors.red.300/50%)]',
  '[--dark-decoration-hover:theme(colors.red.300)]',
  '[--dark-border:theme(colors.red.300/20%)]',
  '[--dark-background:theme(colors.red.300/5%)]',
]

export const orange = [
  // Light
  '[--light-base:theme(colors.orange.600)]',
  '[--light-accent:theme(colors.orange.800)]',
  '[--light-decoration:theme(colors.orange.800/50%)]',
  '[--light-decoration-hover:theme(colors.orange.800)]',
  '[--light-border:theme(colors.orange.800/20%)]',
  '[--light-background:theme(colors.orange.800/5%)]',
  // Dark
  '[--dark-base:theme(colors.orange.400)]',
  '[--dark-accent:theme(colors.orange.300)]',
  '[--dark-decoration:theme(colors.orange.300/50%)]',
  '[--dark-decoration-hover:theme(colors.orange.300)]',
  '[--dark-border:theme(colors.orange.300/20%)]',
  '[--dark-background:theme(colors.orange.300/5%)]',
]

export const amber = [
  // Light
  '[--light-base:theme(colors.amber.600)]',
  '[--light-accent:theme(colors.amber.800)]',
  '[--light-decoration:theme(colors.amber.800/50%)]',
  '[--light-decoration-hover:theme(colors.amber.800)]',
  '[--light-border:theme(colors.amber.800/20%)]',
  '[--light-background:theme(colors.amber.800/5%)]',
  // Dark
  '[--dark-base:theme(colors.amber.400)]',
  '[--dark-accent:theme(colors.amber.300)]',
  '[--dark-decoration:theme(colors.amber.300/50%)]',
  '[--dark-decoration-hover:theme(colors.amber.300)]',
  '[--dark-border:theme(colors.amber.300/20%)]',
  '[--dark-background:theme(colors.amber.300/5%)]',
]

export const yellow = [
  // Light
  '[--light-base:theme(colors.yellow.600)]',
  '[--light-accent:theme(colors.yellow.800)]',
  '[--light-decoration:theme(colors.yellow.800/50%)]',
  '[--light-decoration-hover:theme(colors.yellow.800)]',
  '[--light-border:theme(colors.yellow.800/20%)]',
  '[--light-background:theme(colors.yellow.800/5%)]',
  // Dark
  '[--dark-base:theme(colors.yellow.400)]',
  '[--dark-accent:theme(colors.yellow.300)]',
  '[--dark-decoration:theme(colors.yellow.300/50%)]',
  '[--dark-decoration-hover:theme(colors.yellow.300)]',
  '[--dark-border:theme(colors.yellow.300/20%)]',
  '[--dark-background:theme(colors.yellow.300/5%)]',
]

export const lime = [
  // Light
  '[--light-base:theme(colors.lime.600)]',
  '[--light-accent:theme(colors.lime.800)]',
  '[--light-decoration:theme(colors.lime.800/50%)]',
  '[--light-decoration-hover:theme(colors.lime.800)]',
  '[--light-border:theme(colors.lime.800/20%)]',
  '[--light-background:theme(colors.lime.800/5%)]',
  // Dark
  '[--dark-base:theme(colors.lime.400)]',
  '[--dark-accent:theme(colors.lime.300)]',
  '[--dark-decoration:theme(colors.lime.300/50%)]',
  '[--dark-decoration-hover:theme(colors.lime.300)]',
  '[--dark-border:theme(colors.lime.300/20%)]',
  '[--dark-background:theme(colors.lime.300/5%)]',
]

export const green = [
  // Light
  '[--light-base:theme(colors.green.600)]',
  '[--light-accent:theme(colors.green.800)]',
  '[--light-decoration:theme(colors.green.800/50%)]',
  '[--light-decoration-hover:theme(colors.green.800)]',
  '[--light-border:theme(colors.green.800/20%)]',
  '[--light-background:theme(colors.green.800/5%)]',
  // Dark
  '[--dark-base:theme(colors.green.400)]',
  '[--dark-accent:theme(colors.green.300)]',
  '[--dark-decoration:theme(colors.green.300/50%)]',
  '[--dark-decoration-hover:theme(colors.green.300)]',
  '[--dark-border:theme(colors.green.300/20%)]',
  '[--dark-background:theme(colors.green.300/5%)]',
]

export const emerald = [
  // Light
  '[--light-base:theme(colors.emerald.600)]',
  '[--light-accent:theme(colors.emerald.800)]',
  '[--light-decoration:theme(colors.emerald.800/50%)]',
  '[--light-decoration-hover:theme(colors.emerald.800)]',
  '[--light-border:theme(colors.emerald.800/20%)]',
  '[--light-background:theme(colors.emerald.800/5%)]',
  // Dark
  '[--dark-base:theme(colors.emerald.400)]',
  '[--dark-accent:theme(colors.emerald.300)]',
  '[--dark-decoration:theme(colors.emerald.300/50%)]',
  '[--dark-decoration-hover:theme(colors.emerald.300)]',
  '[--dark-border:theme(colors.emerald.300/20%)]',
  '[--dark-background:theme(colors.emerald.300/5%)]',
]

export const teal = [
  // Light
  '[--light-base:theme(colors.teal.600)]',
  '[--light-accent:theme(colors.teal.800)]',
  '[--light-decoration:theme(colors.teal.800/50%)]',
  '[--light-decoration-hover:theme(colors.teal.800)]',
  '[--light-border:theme(colors.teal.800/20%)]',
  '[--light-background:theme(colors.teal.800/5%)]',
  // Dark
  '[--dark-base:theme(colors.teal.400)]',
  '[--dark-accent:theme(colors.teal.300)]',
  '[--dark-decoration:theme(colors.teal.300/50%)]',
  '[--dark-decoration-hover:theme(colors.teal.300)]',
  '[--dark-border:theme(colors.teal.300/20%)]',
  '[--dark-background:theme(colors.teal.300/5%)]',
]

export const cyan = [
  // Light
  '[--light-base:theme(colors.cyan.600)]',
  '[--light-accent:theme(colors.cyan.800)]',
  '[--light-decoration:theme(colors.cyan.800/50%)]',
  '[--light-decoration-hover:theme(colors.cyan.800)]',
  '[--light-border:theme(colors.cyan.800/20%)]',
  '[--light-background:theme(colors.cyan.800/5%)]',
  // Dark
  '[--dark-base:theme(colors.cyan.400)]',
  '[--dark-accent:theme(colors.cyan.300)]',
  '[--dark-decoration:theme(colors.cyan.300/50%)]',
  '[--dark-decoration-hover:theme(colors.cyan.300)]',
  '[--dark-border:theme(colors.cyan.300/20%)]',
  '[--dark-background:theme(colors.cyan.300/5%)]',
]

export const sky = [
  // Light
  '[--light-base:theme(colors.sky.600)]',
  '[--light-accent:theme(colors.sky.800)]',
  '[--light-decoration:theme(colors.sky.800/50%)]',
  '[--light-decoration-hover:theme(colors.sky.800)]',
  '[--light-border:theme(colors.sky.800/20%)]',
  '[--light-background:theme(colors.sky.800/5%)]',
  // Dark
  '[--dark-base:theme(colors.sky.400)]',
  '[--dark-accent:theme(colors.sky.300)]',
  '[--dark-decoration:theme(colors.sky.300/50%)]',
  '[--dark-decoration-hover:theme(colors.sky.300)]',
  '[--dark-border:theme(colors.sky.300/20%)]',
  '[--dark-background:theme(colors.sky.300/5%)]',
]

export const blue = [
  // Light
  '[--light-base:theme(colors.blue.600)]',
  '[--light-accent:theme(colors.blue.800)]',
  '[--light-decoration:theme(colors.blue.800/50%)]',
  '[--light-decoration-hover:theme(colors.blue.800)]',
  '[--light-border:theme(colors.blue.800/20%)]',
  '[--light-background:theme(colors.blue.800/5%)]',
  // Dark
  '[--dark-base:theme(colors.blue.400)]',
  '[--dark-accent:theme(colors.blue.300)]',
  '[--dark-decoration:theme(colors.blue.300/50%)]',
  '[--dark-decoration-hover:theme(colors.blue.300)]',
  '[--dark-border:theme(colors.blue.300/20%)]',
  '[--dark-background:theme(colors.blue.300/5%)]',
]

export const indigo = [
  // Light
  '[--light-base:theme(colors.indigo.600)]',
  '[--light-accent:theme(colors.indigo.800)]',
  '[--light-decoration:theme(colors.indigo.800/50%)]',
  '[--light-decoration-hover:theme(colors.indigo.800)]',
  '[--light-border:theme(colors.indigo.800/20%)]',
  '[--light-background:theme(colors.indigo.800/5%)]',
  // Dark
  '[--dark-base:theme(colors.indigo.400)]',
  '[--dark-accent:theme(colors.indigo.300)]',
  '[--dark-decoration:theme(colors.indigo.300/50%)]',
  '[--dark-decoration-hover:theme(colors.indigo.300)]',
  '[--dark-border:theme(colors.indigo.300/20%)]',
  '[--dark-background:theme(colors.indigo.300/5%)]',
]

export const violet = [
  // Light
  '[--light-base:theme(colors.violet.600)]',
  '[--light-accent:theme(colors.violet.800)]',
  '[--light-decoration:theme(colors.violet.800/50%)]',
  '[--light-decoration-hover:theme(colors.violet.800)]',
  '[--light-border:theme(colors.violet.800/20%)]',
  '[--light-background:theme(colors.violet.800/5%)]',
  // Dark
  '[--dark-base:theme(colors.violet.400)]',
  '[--dark-accent:theme(colors.violet.300)]',
  '[--dark-decoration:theme(colors.violet.300/50%)]',
  '[--dark-decoration-hover:theme(colors.violet.300)]',
  '[--dark-border:theme(colors.violet.300/20%)]',
  '[--dark-background:theme(colors.violet.300/5%)]',
]

export const purple = [
  // Light
  '[--light-base:theme(colors.purple.600)]',
  '[--light-accent:theme(colors.purple.800)]',
  '[--light-decoration:theme(colors.purple.800/50%)]',
  '[--light-decoration-hover:theme(colors.purple.800)]',
  '[--light-border:theme(colors.purple.800/20%)]',
  '[--light-background:theme(colors.purple.800/5%)]',
  // Dark
  '[--dark-base:theme(colors.purple.400)]',
  '[--dark-accent:theme(colors.purple.300)]',
  '[--dark-decoration:theme(colors.purple.300/50%)]',
  '[--dark-decoration-hover:theme(colors.purple.300)]',
  '[--dark-border:theme(colors.purple.300/20%)]',
  '[--dark-background:theme(colors.purple.300/5%)]',
]

export const fuchsia = [
  // Light
  '[--light-base:theme(colors.fuchsia.600)]',
  '[--light-accent:theme(colors.fuchsia.800)]',
  '[--light-decoration:theme(colors.fuchsia.800/50%)]',
  '[--light-decoration-hover:theme(colors.fuchsia.800)]',
  '[--light-border:theme(colors.fuchsia.800/20%)]',
  '[--light-background:theme(colors.fuchsia.800/5%)]',
  // Dark
  '[--dark-base:theme(colors.fuchsia.400)]',
  '[--dark-accent:theme(colors.fuchsia.300)]',
  '[--dark-decoration:theme(colors.fuchsia.300/50%)]',
  '[--dark-decoration-hover:theme(colors.fuchsia.300)]',
  '[--dark-border:theme(colors.fuchsia.300/20%)]',
  '[--dark-background:theme(colors.fuchsia.300/5%)]',
]

export const pink = [
  // Light
  '[--light-base:theme(colors.pink.600)]',
  '[--light-accent:theme(colors.pink.800)]',
  '[--light-decoration:theme(colors.pink.800/50%)]',
  '[--light-decoration-hover:theme(colors.pink.800)]',
  '[--light-border:theme(colors.pink.800/20%)]',
  '[--light-background:theme(colors.pink.800/5%)]',
  // Dark
  '[--dark-base:theme(colors.pink.400)]',
  '[--dark-accent:theme(colors.pink.300)]',
  '[--dark-decoration:theme(colors.pink.300/50%)]',
  '[--dark-decoration-hover:theme(colors.pink.300)]',
  '[--dark-border:theme(colors.pink.300/20%)]',
  '[--dark-background:theme(colors.pink.300/5%)]',
]

export const rose = [
  // Light
  '[--light-base:theme(colors.rose.600)]',
  '[--light-accent:theme(colors.rose.800)]',
  '[--light-decoration:theme(colors.rose.800/50%)]',
  '[--light-decoration-hover:theme(colors.rose.800)]',
  '[--light-border:theme(colors.rose.800/20%)]',
  '[--light-background:theme(colors.rose.800/5%)]',
  // Dark
  '[--dark-base:theme(colors.rose.400)]',
  '[--dark-accent:theme(colors.rose.300)]',
  '[--dark-decoration:theme(colors.rose.300/50%)]',
  '[--dark-decoration-hover:theme(colors.rose.300)]',
  '[--dark-border:theme(colors.rose.300/20%)]',
  '[--dark-background:theme(colors.rose.300/5%)]',
]
