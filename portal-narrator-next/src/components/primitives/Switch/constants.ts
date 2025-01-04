export const COLORS = {
  'dark/zinc': [
    '[--switch-bg-ring:theme(colors.zinc.950/90%)] [--switch-bg:theme(colors.zinc.900)] dark:[--switch-bg-ring:transparent] dark:[--switch-bg:theme(colors.white/25%)]',
    '[--switch-ring:theme(colors.zinc.950/90%)] [--switch-shadow:theme(colors.black/10%)] [--switch:white] dark:[--switch-ring:theme(colors.zinc.700/90%)]',
  ],
  'dark/white': [
    '[--switch-bg-ring:theme(colors.zinc.950/90%)] [--switch-bg:theme(colors.zinc.900)] dark:[--switch-bg-ring:transparent] dark:[--switch-bg:theme(colors.white)]',
    '[--switch-ring:theme(colors.zinc.950/90%)] [--switch-shadow:theme(colors.black/10%)] [--switch:white] dark:[--switch-ring:transparent] dark:[--switch:theme(colors.zinc.900)]',
  ],
  dark: [
    '[--switch-bg-ring:theme(colors.zinc.950/90%)] [--switch-bg:theme(colors.zinc.900)] dark:[--switch-bg-ring:theme(colors.white/15%)]',
    '[--switch-ring:theme(colors.zinc.950/90%)] [--switch-shadow:theme(colors.black/10%)] [--switch:white]',
  ],
  zinc: [
    '[--switch-bg-ring:theme(colors.zinc.700/90%)] [--switch-bg:theme(colors.zinc.600)] dark:[--switch-bg-ring:transparent]',
    '[--switch-shadow:theme(colors.black/10%)] [--switch:white] [--switch-ring:theme(colors.zinc.700/90%)]',
  ],
  white: [
    '[--switch-bg-ring:theme(colors.black/15%)] [--switch-bg:white] dark:[--switch-bg-ring:transparent]',
    '[--switch-shadow:theme(colors.black/10%)] [--switch-ring:transparent] [--switch:theme(colors.zinc.950)]',
  ],
  red: [
    '[--switch-bg-ring:theme(colors.red.700/90%)] [--switch-bg:theme(colors.red.600)] dark:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:theme(colors.red.700/90%)] [--switch-shadow:theme(colors.red.900/20%)]',
  ],
  orange: [
    '[--switch-bg-ring:theme(colors.orange.600/90%)] [--switch-bg:theme(colors.orange.500)] dark:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:theme(colors.orange.600/90%)] [--switch-shadow:theme(colors.orange.900/20%)]',
  ],
  amber: [
    '[--switch-bg-ring:theme(colors.amber.500/80%)] [--switch-bg:theme(colors.amber.400)] dark:[--switch-bg-ring:transparent]',
    '[--switch-ring:transparent] [--switch-shadow:transparent] [--switch:theme(colors.amber.950)]',
  ],
  yellow: [
    '[--switch-bg-ring:theme(colors.yellow.400/80%)] [--switch-bg:theme(colors.yellow.300)] dark:[--switch-bg-ring:transparent]',
    '[--switch-ring:transparent] [--switch-shadow:transparent] [--switch:theme(colors.yellow.950)]',
  ],
  lime: [
    '[--switch-bg-ring:theme(colors.lime.400/80%)] [--switch-bg:theme(colors.lime.300)] dark:[--switch-bg-ring:transparent]',
    '[--switch-ring:transparent] [--switch-shadow:transparent] [--switch:theme(colors.lime.950)]',
  ],
  green: [
    '[--switch-bg-ring:theme(colors.green.700/90%)] [--switch-bg:theme(colors.green.600)] dark:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:theme(colors.green.700/90%)] [--switch-shadow:theme(colors.green.900/20%)]',
  ],
  emerald: [
    '[--switch-bg-ring:theme(colors.emerald.600/90%)] [--switch-bg:theme(colors.emerald.500)] dark:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:theme(colors.emerald.600/90%)] [--switch-shadow:theme(colors.emerald.900/20%)]',
  ],
  teal: [
    '[--switch-bg-ring:theme(colors.teal.700/90%)] [--switch-bg:theme(colors.teal.600)] dark:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:theme(colors.teal.700/90%)] [--switch-shadow:theme(colors.teal.900/20%)]',
  ],
  cyan: [
    '[--switch-bg-ring:theme(colors.cyan.400/80%)] [--switch-bg:theme(colors.cyan.300)] dark:[--switch-bg-ring:transparent]',
    '[--switch-ring:transparent] [--switch-shadow:transparent] [--switch:theme(colors.cyan.950)]',
  ],
  sky: [
    '[--switch-bg-ring:theme(colors.sky.600/80%)] [--switch-bg:theme(colors.sky.500)] dark:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:theme(colors.sky.600/80%)] [--switch-shadow:theme(colors.sky.900/20%)]',
  ],
  blue: [
    '[--switch-bg-ring:theme(colors.blue.700/90%)] [--switch-bg:theme(colors.blue.600)] dark:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:theme(colors.blue.700/90%)] [--switch-shadow:theme(colors.blue.900/20%)]',
  ],
  indigo: [
    '[--switch-bg-ring:theme(colors.indigo.600/90%)] [--switch-bg:theme(colors.indigo.500)] dark:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:theme(colors.indigo.600/90%)] [--switch-shadow:theme(colors.indigo.900/20%)]',
  ],
  violet: [
    '[--switch-bg-ring:theme(colors.violet.600/90%)] [--switch-bg:theme(colors.violet.500)] dark:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:theme(colors.violet.600/90%)] [--switch-shadow:theme(colors.violet.900/20%)]',
  ],
  purple: [
    '[--switch-bg-ring:theme(colors.purple.600/90%)] [--switch-bg:theme(colors.purple.500)] dark:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:theme(colors.purple.600/90%)] [--switch-shadow:theme(colors.purple.900/20%)]',
  ],
  fuchsia: [
    '[--switch-bg-ring:theme(colors.fuchsia.600/90%)] [--switch-bg:theme(colors.fuchsia.500)] dark:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:theme(colors.fuchsia.600/90%)] [--switch-shadow:theme(colors.fuchsia.900/20%)]',
  ],
  pink: [
    '[--switch-bg-ring:theme(colors.pink.600/90%)] [--switch-bg:theme(colors.pink.500)] dark:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:theme(colors.pink.600/90%)] [--switch-shadow:theme(colors.pink.900/20%)]',
  ],
  rose: [
    '[--switch-bg-ring:theme(colors.rose.600/90%)] [--switch-bg:theme(colors.rose.500)] dark:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:theme(colors.rose.600/90%)] [--switch-shadow:theme(colors.rose.900/20%)]',
  ],
}
