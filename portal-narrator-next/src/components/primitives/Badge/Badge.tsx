import clsx from 'clsx'

import { BASE_BADGE_STYLES, OUTLINE_BADGE_STYLES, SIZES, SOFT_BADGE_STYLES, SOLID_BADGE_STYLES } from './constants'
import { IBadge } from './interfaces'
import * as COLORS from './palette'

type Props = IBadge & Omit<React.ComponentPropsWithoutRef<'span'>, 'className'>

const Badge = ({ color = 'indigo', outline = false, pill = false, size = 'md', soft = false, ...props }: Props) => {
  const COLOR = COLORS[color]
  const TYPE = outline ? OUTLINE_BADGE_STYLES : soft ? SOFT_BADGE_STYLES : SOLID_BADGE_STYLES

  return (
    <span
      {...props}
      className={clsx(BASE_BADGE_STYLES, COLOR, TYPE, SIZES[size], pill ? '!rounded-full' : 'rounded-md')}
    />
  )
}

export default Badge
