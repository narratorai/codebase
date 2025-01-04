import { Radio as HeadlessRadio, RadioProps as HeadlessRadioProps } from '@headlessui/react'
import { CheckCircleIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'

import { COLORS } from './constants'

type Color = keyof typeof COLORS

type Props = { color?: Color; children: React.ReactNode } & Omit<HeadlessRadioProps, 'as' | 'className' | 'children'>

const RadioCard = ({ children, color = 'dark/zinc', ...props }: Props) => (
  <HeadlessRadio data-slot="control" {...props} className="group">
    <span
      className={clsx(
        // Basic layout
        'relative box-content flex cursor-pointer rounded-lg bg-white p-4 shadow-sm',
        // Border
        'border border-gray-300 ring-1 ring-transparent group-data-[checked]:border-[--radio-checked-bg] group-data-[checked]:group-data-[hover]:border-[--radio-checked-bg] group-data-[hover]:border-[--radio-checked-bg] group-data-[checked]:ring-[--radio-checked-bg]',
        'dark:border-white/15 dark:group-data-[checked]:border-[--radio-checked-bg] dark:group-data-[checked]:group-data-[hover]:border-[--radio-checked-bg] dark:group-data-[hover]:border-[--radio-checked-bg] dark:group-data-[checked]:ring-[--radio-checked-bg]',
        // Focus ring
        'focus:outline-none focus:ring-transparent group-data-[focus]:border-[--radio-checked-bg]',
        // Disabled state
        'group-data-[disabled]:opacity-50',
        'group-data-[disabled]:border-zinc-950/25 group-data-[disabled]:bg-zinc-950/5 group-data-[disabled]:[--radio-checked-indicator:theme(colors.zinc.950/50%)] group-data-[disabled]:before:bg-transparent',
        'dark:group-data-[disabled]:border-white/20 dark:group-data-[disabled]:bg-white/[2.5%] dark:group-data-[disabled]:[--radio-checked-indicator:theme(colors.white/50%)] dark:group-data-[disabled]:group-data-[checked]:after:hidden',
        COLORS[color]
      )}
    >
      <span className="flex flex-1 pr-2">
        <span className="flex flex-col">{children}</span>
      </span>
      <CheckCircleIcon
        aria-hidden="true"
        className="h-5 w-5 text-[--radio-checked-bg] [.group:not([data-checked])_&]:invisible"
      />
    </span>
  </HeadlessRadio>
)

export default RadioCard
