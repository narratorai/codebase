import { Checkbox as HeadlessCheckbox } from '@headlessui/react'
import * as OutlineIcons from '@heroicons/react/24/outline'
import * as SolidIcons from '@heroicons/react/24/solid'
import clsx from 'clsx'

import { ICON_COLORS } from './constants'
import { HeadlessCheckboxProps, Icon, IconColor } from './interfaces'

export interface Props extends HeadlessCheckboxProps {
  color?: IconColor
  icon: Icon
}

const CheckboxIcon = ({ color = 'dark/zinc', icon, ...props }: Props) => {
  const SolidIcon = SolidIcons[icon]
  const OutlineIcon = OutlineIcons[icon]

  return (
    <HeadlessCheckbox data-slot="control" {...props} className="group inline-flex focus:outline-none">
      <span
        className={clsx(
          // Basic layout
          'relative isolate flex size-6 items-center justify-center bg-transparent sm:size-5',
          // Background color + shadow applied to inset pseudo element, so shadow blends with border in light mode
          'before:absolute before:-z-10',
          // Focus ring
          'group-data-[focus]:outline group-data-[focus]:outline-2 group-data-[focus]:outline-offset-2 group-data-[focus]:outline-blue-500',
          // Disabled state
          'group-data-[disabled]:[--checkbox-check:theme(colors.zinc.950/50%)] group-data-[disabled]:before:bg-transparent',
          'dark:group-data-[disabled]:[--checkbox-check:theme(colors.white/50%)] dark:group-data-[disabled]:group-data-[checked]:after:hidden',
          // Forced colors mode
          'forced-colors:[--checkbox-check:HighlightText] forced-colors:group-data-[disabled]:[--checkbox-check:Highlight]',
          'dark:forced-colors:[--checkbox-check:HighlightText] dark:forced-colors:group-data-[disabled]:[--checkbox-check:Highlight]',
          ICON_COLORS[color]
        )}
      >
        <SolidIcon className="absolute text-[--checkbox-check] opacity-0 group-data-[checked]:opacity-100" />
        <OutlineIcon className="absolute text-[--checkbox-check] opacity-100 group-data-[checked]:opacity-0" />
      </span>
    </HeadlessCheckbox>
  )
}

export default CheckboxIcon
