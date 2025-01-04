import { Button as HeadlessButton, ButtonProps as HeadlessButtonProps } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { forwardRef } from 'react'

import Badge from './Badge'
import { REMOVE_BUTTON_STYLES, SOFT_REMOVE_BUTTON_ICON_STYLES, SOLID_REMOVE_BUTTON_ICON_STYLES } from './constants'
import { IBadge } from './interfaces'
import * as COLORS from './palette'

type Ref = React.ForwardedRef<HTMLElement>
type Props = { children: React.ReactNode } & IBadge & Omit<HeadlessButtonProps, 'as' | 'className'>

const BadgeRemoveButton = (
  { children, color = 'indigo', outline = false, pill = false, size = 'md', soft = false, ...props }: Props,
  ref: Ref
) => {
  const COLOR = COLORS[color]
  const REMOVE_BUTTON_ICON_STYLES = outline || soft ? SOFT_REMOVE_BUTTON_ICON_STYLES : SOLID_REMOVE_BUTTON_ICON_STYLES

  return (
    <Badge color={color} outline={outline} pill={pill} size={size} soft={soft}>
      {children}
      <HeadlessButton
        className={clsx(REMOVE_BUTTON_STYLES, COLOR, pill ? '!rounded-full' : 'rounded-sm')}
        ref={ref}
        {...props}
      >
        <span className="sr-only">Remove</span>
        <XMarkIcon className={clsx(REMOVE_BUTTON_ICON_STYLES, COLOR, pill ? '!rounded-full' : 'rounded-sm')} />
        <span className="absolute -inset-1" />
      </HeadlessButton>
    </Badge>
  )
}

export default forwardRef(BadgeRemoveButton)
