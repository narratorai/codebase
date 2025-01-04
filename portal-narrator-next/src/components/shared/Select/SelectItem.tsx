import type { SelectItemProps } from '@radix-ui/react-select'
import { Item, ItemText } from '@radix-ui/react-select'
import clsx from 'clsx'
import React from 'react'

type ItemProps = SelectItemProps & React.RefAttributes<HTMLDivElement>

interface Props extends ItemProps {
  children: React.ReactNode
}

const SelectItem = ({ children, className, ...props }: Props) => (
  <Item {...props} className={clsx('w-full cursor-pointer rounded-md text-sm', className)}>
    <ItemText>{children}</ItemText>
  </Item>
)

export default SelectItem
