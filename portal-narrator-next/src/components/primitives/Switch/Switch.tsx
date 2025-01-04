import { Switch as HeadlessSwitch, SwitchProps as HeadlessSwitchProps } from '@headlessui/react'
import clsx from 'clsx'

import { COLORS } from './constants'

type Color = keyof typeof COLORS

type Props = {
  color?: Color
} & Omit<HeadlessSwitchProps, 'as' | 'className' | 'children'>

const Switch = ({ color = 'dark/zinc', ...props }: Props) => (
  <HeadlessSwitch
    className={clsx(
      // Base styles
      'group relative isolate inline-flex h-6 w-10 cursor-pointer rounded-full p-[3px] sm:h-5 sm:w-8',
      // Transitions
      'transition duration-0 ease-in-out data-[changing]:duration-200',
      // Outline and background color in forced-colors mode so switch is still visible
      'forced-colors:outline forced-colors:[--switch-bg:Highlight] dark:forced-colors:[--switch-bg:Highlight]',
      // Unchecked
      'bg-zinc-200 ring-1 ring-inset ring-black/5 dark:bg-white/5 dark:ring-white/15',
      // Checked
      'data-[checked]:bg-[--switch-bg] data-[checked]:ring-[--switch-bg-ring] dark:data-[checked]:bg-[--switch-bg] dark:data-[checked]:ring-[--switch-bg-ring]',
      // Focus
      'focus:outline-none data-[focus]:outline data-[focus]:outline-2 data-[focus]:outline-offset-2 data-[focus]:outline-blue-500',
      // Hover
      'data-[hover]:data-[checked]:ring-[--switch-bg-ring] data-[hover]:ring-black/15',
      'dark:data-[hover]:data-[checked]:ring-[--switch-bg-ring] dark:data-[hover]:ring-white/25',
      // Disabled
      'data-[disabled]:bg-zinc-200 data-[disabled]:data-[checked]:bg-zinc-200 data-[disabled]:opacity-50 data-[disabled]:data-[checked]:ring-black/5',
      'dark:data-[disabled]:bg-white/15 dark:data-[disabled]:data-[checked]:bg-white/15 dark:data-[disabled]:data-[checked]:ring-white/15',
      // Color specific styles
      COLORS[color]
    )}
    data-slot="control"
    {...props}
  >
    <span
      aria-hidden="true"
      className={clsx(
        // Basic layout
        'pointer-events-none relative inline-block size-[1.125rem] rounded-full sm:size-3.5',
        // Transition
        'translate-x-0 transition duration-200 ease-in-out',
        // Invisible border so the switch is still visible in forced-colors mode
        'border border-transparent',
        // Unchecked
        'bg-white shadow ring-1 ring-black/5',
        // Checked
        'group-data-[checked]:bg-[--switch] group-data-[checked]:shadow-[--switch-shadow] group-data-[checked]:ring-[--switch-ring]',
        'group-data-[checked]:translate-x-4 sm:group-data-[checked]:translate-x-3',
        // Disabled
        'group-data-[disabled]:group-data-[checked]:bg-white group-data-[disabled]:group-data-[checked]:shadow group-data-[disabled]:group-data-[checked]:ring-black/5'
      )}
    />
  </HeadlessSwitch>
)

export default Switch
