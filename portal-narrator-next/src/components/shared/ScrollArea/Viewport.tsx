import type { ScrollAreaViewportProps } from '@radix-ui/react-scroll-area'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import React from 'react'

type ViewportProps = ScrollAreaViewportProps & React.RefAttributes<HTMLDivElement>

interface Props extends ViewportProps {
  children: React.ReactNode
}

const Viewport = ({ children, ...props }: Props) => (
  <ScrollArea.Viewport {...props} className="h-full w-full">
    {children}
  </ScrollArea.Viewport>
)

export default Viewport
