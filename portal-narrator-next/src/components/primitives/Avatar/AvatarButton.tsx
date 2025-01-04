import { Button as HeadlessButton, ButtonProps as HeadlessButtonProps } from '@headlessui/react'
import clsx from 'clsx'
import React, { forwardRef } from 'react'

import { TouchTarget } from '../Button'
import { Link, LinkRef } from '../Link'
import Avatar from './Avatar'
import { AVATAR_ROUND_STYLES, AVATAR_SQUARE_STYLES } from './constants'
import { IAvatar } from './interfaces'
import * as COLORS from './palette'

type AvatarButtonRef = React.ForwardedRef<HTMLElement>

type Props = IAvatar &
  (Omit<HeadlessButtonProps, 'as' | 'className'> | Omit<React.ComponentPropsWithoutRef<typeof Link>, 'className'>)

const AvatarButton = (
  { alt, color = 'indigo', icon, initials, ring = false, size = 'md', square = false, src, ...props }: Props,
  ref: AvatarButtonRef
) => {
  const className = clsx(
    'group relative inline-grid focus:outline-none',
    'data-[focus]:outline data-[focus]:outline-2 data-[focus]:outline-offset-2',
    'data-[focus]:outline-[--light-accent-focus] dark:data-[focus]:outline-[--dark-accent-focus]',
    COLORS[color],
    square ? AVATAR_SQUARE_STYLES : AVATAR_ROUND_STYLES
  )

  return 'href' in props ? (
    <Link {...props} className={className} ref={ref as LinkRef}>
      <TouchTarget>
        <Avatar
          alt={alt}
          color={color}
          icon={icon}
          initials={initials}
          ring={ring}
          size={size}
          square={square}
          src={src}
        />
      </TouchTarget>
    </Link>
  ) : (
    <HeadlessButton {...props} className={className} ref={ref}>
      <TouchTarget>
        <Avatar
          alt={alt}
          color={color}
          icon={icon}
          initials={initials}
          ring={ring}
          size={size}
          square={square}
          src={src}
        />
      </TouchTarget>
    </HeadlessButton>
  )
}

export default forwardRef(AvatarButton)
