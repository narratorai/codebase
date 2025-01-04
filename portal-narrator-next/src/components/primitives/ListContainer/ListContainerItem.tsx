import clsx from 'clsx'
import { forwardRef } from 'react'

import { CARD_STYLES, ITEM_STYLES } from './constants'
import { Card, Item } from './interfaces'

type Ref = React.ForwardedRef<HTMLLIElement>

type Props = {
  card?: Card
  item?: Item
} & Omit<React.ComponentPropsWithoutRef<'li'>, 'className'>

const ListContainerItem = ({ card, item, ...props }: Props, ref: Ref) => (
  <li className={clsx('py-4', card && CARD_STYLES[card], item && ITEM_STYLES[item])} ref={ref} {...props} />
)

export default forwardRef(ListContainerItem)
