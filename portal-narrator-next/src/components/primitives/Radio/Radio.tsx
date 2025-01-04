import { Radio as HeadlessRadio, RadioProps as HeadlessRadioProps } from '@headlessui/react'
import clsx from 'clsx'

import { COLORS } from './constants'

type Color = keyof typeof COLORS

type Props = { color?: Color } & Omit<HeadlessRadioProps, 'as' | 'className' | 'children'>

const Radio = ({ color = 'dark/zinc', ...props }: Props) => (
  <HeadlessRadio data-slot="control" {...props} className="group inline-flex focus:outline-none">
    <span
      className={clsx(
        // Basic layout
        'relative isolate flex size-[1.1875rem] shrink-0 rounded-full sm:size-[1.0625rem]',
        // Background color + shadow applied to inset pseudo element, so shadow blends with border in light mode
        'before:absolute before:inset-0 before:-z-10 before:rounded-full before:bg-white before:shadow',
        // Background color when checked
        'before:group-data-[checked]:bg-[--radio-checked-bg]',
        // Background color is moved to control and shadow is removed in dark mode so hide `before` pseudo
        'dark:before:hidden',
        // Background color applied to control in dark mode
        'dark:bg-white/5 dark:group-data-[checked]:bg-[--radio-checked-bg]',
        // Border
        'border border-zinc-950/15 group-data-[checked]:border-transparent group-data-[checked]:group-data-[hover]:border-transparent group-data-[hover]:border-zinc-950/30 group-data-[checked]:bg-[--radio-checked-border]',
        'dark:border-white/15 dark:group-data-[checked]:border-white/5 dark:group-data-[checked]:group-data-[hover]:border-white/5 dark:group-data-[hover]:border-white/30',
        // Inner highlight shadow
        'after:absolute after:inset-0 after:rounded-full after:shadow-[inset_0_1px_theme(colors.white/15%)]',
        'dark:after:-inset-px dark:after:hidden dark:after:rounded-full dark:group-data-[checked]:after:block',
        // Indicator color (light mode)
        '[--radio-indicator:transparent] group-data-[hover]:[--radio-indicator:theme(colors.zinc.900/10%)] group-data-[checked]:[--radio-indicator:var(--radio-checked-indicator)] group-data-[checked]:group-data-[hover]:[--radio-indicator:var(--radio-checked-indicator)]',
        // Indicator color (dark mode)
        'dark:group-data-[hover]:[--radio-indicator:theme(colors.zinc.700)] dark:group-data-[checked]:group-data-[hover]:[--radio-indicator:var(--radio-checked-indicator)]',
        // Focus ring
        'group-data-[focus]:outline group-data-[focus]:outline-2 group-data-[focus]:outline-offset-2 group-data-[focus]:outline-blue-500',
        // Disabled state
        'group-data-[disabled]:opacity-50',
        'group-data-[disabled]:border-zinc-950/25 group-data-[disabled]:bg-zinc-950/5 group-data-[disabled]:[--radio-checked-indicator:theme(colors.zinc.950/50%)] group-data-[disabled]:before:bg-transparent',
        'dark:group-data-[disabled]:border-white/20 dark:group-data-[disabled]:bg-white/[2.5%] dark:group-data-[disabled]:[--radio-checked-indicator:theme(colors.white/50%)] dark:group-data-[disabled]:group-data-[checked]:after:hidden',
        COLORS[color]
      )}
    >
      <span
        className={clsx(
          'size-full rounded-full border-[4.5px] border-transparent bg-[--radio-indicator] bg-clip-padding',
          // Forced colors mode
          'forced-colors:border-[Canvas] forced-colors:group-data-[checked]:border-[Highlight]'
        )}
      />
    </span>
  </HeadlessRadio>
)

export default Radio
