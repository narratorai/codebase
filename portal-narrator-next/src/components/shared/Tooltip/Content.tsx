import type { TooltipContentProps } from '@radix-ui/react-tooltip'
import * as Tooltip from '@radix-ui/react-tooltip'
import React, { ForwardedRef, forwardRef } from 'react'

type ContentProps = TooltipContentProps & React.RefAttributes<HTMLDivElement>

interface Props extends ContentProps {
  children: React.ReactNode
}

const Content = ({ children, ...props }: Props, ref: ForwardedRef<HTMLDivElement>) => (
  <Tooltip.Content sideOffset={4} {...props} ref={ref} className="bordered-gray-1000 z-50 rounded bg-gray-1000">
    {children}
  </Tooltip.Content>
)

export default forwardRef(Content)
