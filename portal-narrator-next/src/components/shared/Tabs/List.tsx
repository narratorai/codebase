import type { TabsListProps } from '@radix-ui/react-tabs'
import * as Tabs from '@radix-ui/react-tabs'
import React from 'react'

type ListProps = TabsListProps & React.RefAttributes<HTMLDivElement>

interface Props extends ListProps {
  children: React.ReactNode
}

const List = ({ children, ...props }: Props) => <Tabs.List {...props}>{children}</Tabs.List>

export default List
