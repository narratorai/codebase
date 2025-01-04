import * as OutlineIcons from '@heroicons/react/24/outline'
import * as SolidIcons from '@heroicons/react/24/solid'
import clsx from 'clsx'
import { forwardRef } from 'react'

import AvatarInitials from './AvatarInitials'
import {
  AVATAR_EXTENDED_STYLES,
  AVATAR_RING_STYLES,
  AVATAR_ROUND_STYLES,
  AVATAR_SQUARE_STYLES,
  DIMENSIONS,
  SIZES,
} from './constants'
import { IAvatar, OutlineIcon, SolidIcon } from './interfaces'
import * as COLORS from './palette'

type Ref = React.ForwardedRef<HTMLSpanElement>

type Props = IAvatar & React.ComponentPropsWithoutRef<'span'>

const Avatar = (
  {
    alt = '',
    color = 'transparent',
    icon,
    initials,
    ring = false,
    size = 'md',
    square = false,
    src = null,
    ...props
  }: Props,
  ref: Ref
) => {
  const Icon = icon?.startsWith('Solid')
    ? SolidIcons[icon.replace('Solid', '') as SolidIcon]
    : icon?.startsWith('Outline')
      ? OutlineIcons[icon.replace('Outline', '') as OutlineIcon]
      : null

  return (
    <span
      {...props}
      className={clsx(
        'inline-grid shrink-0 align-middle *:col-start-1 *:row-start-1',
        !Icon && AVATAR_EXTENDED_STYLES,
        square ? AVATAR_SQUARE_STYLES : AVATAR_ROUND_STYLES,
        ring && AVATAR_RING_STYLES,
        SIZES[size],
        COLORS[color]
      )}
      ref={ref}
    >
      {initials && <AvatarInitials alt={alt} initials={initials} />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img alt={alt} className="size-full" height={DIMENSIONS[size]} src={src} width={DIMENSIONS[size]} />}
      {Icon && (
        <Icon
          aria-hidden={alt ? undefined : 'true'}
          className={clsx(
            // Base
            'size-full',
            // Default
            'text-[--light-accent] dark:text-[--dark-accent]',
            // Hover
            'group-data-[hover]:text-[--light-accent-hover] dark:group-data-[hover]:text-[--dark-accent-hover]'
          )}
        />
      )}
    </span>
  )
}

export default forwardRef(Avatar)
