import type { ScrollAreaCornerProps } from '@radix-ui/react-scroll-area'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import React from 'react'

type Props = ScrollAreaCornerProps & React.RefAttributes<HTMLDivElement>

const Scrollbar = ({ ...props }: Props) => <ScrollArea.Corner {...props} className="bg-white" />

export default Scrollbar
