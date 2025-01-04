import type { ScrollAreaScrollbarProps } from '@radix-ui/react-scroll-area'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import React from 'react'

type Props = ScrollAreaScrollbarProps & React.RefAttributes<HTMLDivElement>

const VerticalScrollbar = ({ ...props }: Props) => (
  <ScrollArea.Scrollbar {...props} orientation="vertical" className="w-1 touch-none select-none rounded-full bg-white">
    <ScrollArea.Thumb className="h-full min-h-4 w-1 rounded-full bg-gray-200" />
  </ScrollArea.Scrollbar>
)

export default VerticalScrollbar
