import clsx from 'clsx'

import { Color } from './interfaces'
import * as COLORS from './palette'

interface Props {
  color: Color
  text: string
}

const AvatarDetailsLabel = ({ color, text }: Props) => {
  return (
    <p
      className={clsx(
        // Base
        'bg-transparent text-left text-sm font-medium sm:text-sm sm:font-medium',
        // Default
        'text-[--light-accent] dark:text-[--dark-accent]',
        // Hover
        'group-data-[hover]:text-[--light-accent-hover] dark:group-data-[hover]:text-[--dark-accent-hover]',
        COLORS[color]
      )}
    >
      {text}
    </p>
  )
}

export default AvatarDetailsLabel
