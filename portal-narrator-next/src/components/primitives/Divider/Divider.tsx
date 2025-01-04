import clsx from 'clsx'

import { DIVIDER_STYLES } from './constants'
import { IDivider } from './interfaces'

type Props = IDivider

const Divider = ({ soft = false, ...props }: Props) => (
  <hr role="presentation" {...props} className={clsx('w-full border-t', DIVIDER_STYLES[soft ? 'soft' : 'default'])} />
)

export default Divider
