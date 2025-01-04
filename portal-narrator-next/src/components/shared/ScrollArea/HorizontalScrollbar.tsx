import type { ScrollAreaScrollbarProps } from '@radix-ui/react-scroll-area'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import React from 'react'

type Props = ScrollAreaScrollbarProps & React.RefAttributes<HTMLDivElement>

const HorizontalScrollbar = ({ ...props }: Props) => (
  <ScrollArea.Scrollbar
    {...props}
    orientation="horizontal"
    className="h-1 touch-none select-none rounded-full bg-white"
  >
    <ScrollArea.Thumb className="h-1 w-full min-w-4 rounded-full bg-gray-200" />
  </ScrollArea.Scrollbar>
)

export default HorizontalScrollbar
