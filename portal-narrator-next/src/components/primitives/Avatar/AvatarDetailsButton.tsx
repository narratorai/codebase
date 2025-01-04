import { Button as HeadlessButton, ButtonProps as HeadlessButtonProps } from '@headlessui/react'
import clsx from 'clsx'
import React, { forwardRef } from 'react'

import { TouchTarget } from '../Button'
import { Link } from '../Link'
import AvatarDetails from './AvatarDetails'
import { AVATAR_DETAILS_SQUARE_STYLES, AVATAR_ROUND_STYLES } from './constants'
import { IAvatarDetails } from './interfaces'
import * as COLORS from './palette'

type AvatarDetailsRef = React.ForwardedRef<HTMLAnchorElement | HTMLButtonElement>

type Props = IAvatarDetails &
  (Omit<HeadlessButtonProps, 'as' | 'className'> | Omit<React.ComponentPropsWithoutRef<typeof Link>, 'className'>)

const AvatarDetailsButton = (
  {
    alt,
    color = 'zinc',
    description,
    icon,
    initials,
    label,
    ring = false,
    size = 'md',
    square = false,
    src,
    ...props
  }: Props,
  ref: AvatarDetailsRef
) => {
  const asLink = 'href' in props
  const Wrapper = asLink ? Link : HeadlessButton

  const className = clsx(
    // Base
    'group relative inline-grid focus:outline-none',
    // Focus
    'data-[focus]:outline data-[focus]:outline-2 data-[focus]:outline-offset-8 data-[focus]:outline-[--light-accent-focus] dark:data-[focus]:outline-[--dark-accent-focus]',
    COLORS[color],
    square ? AVATAR_DETAILS_SQUARE_STYLES : AVATAR_ROUND_STYLES
  )

  return (
    // @ts-expect-error ref can be either LinkRef or ButtonRef depending on the `as` prop
    <Wrapper {...props} className={className} ref={ref}>
      <TouchTarget>
        <AvatarDetails
          color={color}
          description={description}
          icon={icon}
          initials={initials}
          label={label}
          ring={ring}
          size={size}
          square={square}
          src={src}
        />
      </TouchTarget>
    </Wrapper>
  )
}

export default forwardRef(AvatarDetailsButton)
