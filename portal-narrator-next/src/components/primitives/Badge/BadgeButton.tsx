import { Button as HeadlessButton, ButtonProps as HeadlessButtonProps } from '@headlessui/react'
import clsx from 'clsx'
import { forwardRef } from 'react'

import { TouchTarget } from '../Button'
import { Link, LinkRef } from '../Link'
import Badge from './Badge'
import { BADGE_BUTTON_STYLES, SOFT_BADGE_BUTTON_STYLES, SOLID_BADGE_BUTTON_STYLES } from './constants'
import { IBadge } from './interfaces'
import * as COLORS from './palette'

type BadgeButtonRef = React.ForwardedRef<HTMLElement>
type Props = { children: React.ReactNode } & (
  | Omit<HeadlessButtonProps, 'as' | 'className'>
  | Omit<React.ComponentPropsWithoutRef<typeof Link>, 'className'>
) &
  IBadge

const BadgeButton = (
  { children, color = 'indigo', outline = false, pill = false, size = 'md', soft = false, ...props }: Props,
  ref: BadgeButtonRef
) => {
  const COLOR = COLORS[color]
  const TYPE = outline ? SOFT_BADGE_BUTTON_STYLES : soft ? SOFT_BADGE_BUTTON_STYLES : SOLID_BADGE_BUTTON_STYLES

  if ('href' in props)
    return (
      <Link
        className={clsx(BADGE_BUTTON_STYLES, TYPE, COLOR, pill ? '!rounded-full' : 'rounded-md')}
        ref={ref as LinkRef}
        {...props}
      >
        <TouchTarget>
          <Badge color={color} outline={outline} pill={pill} size={size} soft={soft}>
            {children}
          </Badge>
        </TouchTarget>
      </Link>
    )

  return (
    <HeadlessButton
      className={clsx(BADGE_BUTTON_STYLES, TYPE, COLOR, pill ? '!rounded-full' : 'rounded-md')}
      ref={ref}
      {...props}
    >
      <TouchTarget>
        <Badge color={color} outline={outline} pill={pill} size={size} soft={soft}>
          {children}
        </Badge>
      </TouchTarget>
    </HeadlessButton>
  )
}

export default forwardRef(BadgeButton)
