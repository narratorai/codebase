import type { TabsContentProps } from '@radix-ui/react-tabs'
import * as Tabs from '@radix-ui/react-tabs'
import React from 'react'

type ContentProps = TabsContentProps & React.RefAttributes<HTMLDivElement>

interface Props extends ContentProps {
  children: React.ReactNode
}

const Content = ({ children, ...props }: Props) => <Tabs.Content {...props}>{children}</Tabs.Content>

export default Content
