import type { ScrollAreaProps } from '@radix-ui/react-scroll-area'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import React from 'react'

type RootProps = ScrollAreaProps & React.RefAttributes<HTMLDivElement>

interface Props extends RootProps {
  children: React.ReactNode
}

const Root = ({ children, ...props }: Props) => <ScrollArea.Root {...props}>{children}</ScrollArea.Root>

export default Root
