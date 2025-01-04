import clsx from 'clsx'

import { ITEM_STYLES } from './constants'
import { IDividerItem } from './interfaces'

type Props = IDividerItem

const DividerItem = ({ padding = 'none', position = 'center', ...props }: Props) => (
  <div {...props} className={clsx('bg-white', ITEM_STYLES[padding][position])} />
)

export default DividerItem
