import { Checkbox as HeadlessCheckbox } from '@headlessui/react'
import { CheckIcon } from '@heroicons/react/16/solid'
import clsx from 'clsx'

import { BASE, COLORS } from './constants'
import { Color, HeadlessCheckboxProps } from './interfaces'

export interface Props extends HeadlessCheckboxProps {
  color?: Color
}

const Checkbox = ({ color = 'dark/zinc', ...props }: Props) => (
  <HeadlessCheckbox className="group inline-flex focus:outline-none" data-slot="control" {...props}>
    <span className={clsx([BASE, COLORS[color]])}>
      <CheckIcon className="size-4 stroke-[--checkbox-check] text-[--checkbox-check] opacity-0 group-data-[checked]:opacity-100 sm:h-3.5 sm:w-3.5" />
    </span>
  </HeadlessCheckbox>
)

export default Checkbox
