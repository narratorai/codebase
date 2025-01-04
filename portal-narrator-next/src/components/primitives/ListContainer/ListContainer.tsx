import clsx from 'clsx'
import React, { forwardRef } from 'react'

import { CARD_STYLES, LIST_STYLES } from './constants'
import { Card, List } from './interfaces'

type Ref = React.ForwardedRef<HTMLUListElement>

type Props = {
  card?: Card
  list?: List
} & Omit<React.ComponentPropsWithoutRef<'ul'>, 'className'>

const ListContainer = ({ card, list, ...props }: Props, ref: Ref) => (
  <div className={clsx(card && CARD_STYLES[card])}>
    <ul className={clsx(list && LIST_STYLES[list])} ref={ref} {...props} />
  </div>
)

export default forwardRef(ListContainer)
