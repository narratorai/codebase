import clsx from 'clsx'

import { Avatar, COLORS, IAvatar } from '../Avatar'
import { ALIGN } from './constants'

type Align = keyof typeof ALIGN

interface Props extends IAvatar {
  align: Align
  description: string
  label: string
}

const MediaObject = ({ align = 'top', color = 'white', description, label, ...props }: Props) => (
  <div className={clsx('text-[--light-accent] dark:text-[--dark-accent]', COLORS[color], 'flex')}>
    <div className={clsx(ALIGN[align], 'mr-4')}>
      <Avatar alt={label} color={color} {...props} />
    </div>
    <div>
      <h4 className="text-lg font-bold">{label}</h4>
      <p className="mt-1">{description}</p>
    </div>
  </div>
)

export default MediaObject
