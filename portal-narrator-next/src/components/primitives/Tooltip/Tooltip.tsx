import {
  Arrow,
  Content,
  Portal,
  Root,
  TooltipArrowProps,
  TooltipContentProps,
  TooltipProps,
  Trigger,
} from '@radix-ui/react-tooltip'
import React from 'react'

interface Props {
  arrow?: Omit<TooltipArrowProps, 'className'>
  children: React.ReactNode
  content?: Omit<TooltipContentProps, 'className'>
  root?: Omit<TooltipProps, 'className'>
  showArrow?: boolean
  tip: React.ReactNode
}

const Tooltip = ({ arrow, children, content, root, showArrow, tip }: Props) => (
  <Root {...root}>
    <Trigger asChild>{children}</Trigger>
    <Portal>
      {tip !== null && (
        <Content
          {...content}
          className="z-50 rounded bg-gray-950 px-3 py-2 text-sm font-medium text-white shadow-sm dark:bg-white dark:text-gray-950 dark:ring-1 dark:ring-gray-950/5"
        >
          {tip}
          {showArrow && (
            <Arrow {...arrow} className="fill-gray-950 stroke-gray-950 dark:fill-white dark:stroke-white" />
          )}
        </Content>
      )}
    </Portal>
  </Root>
)

export default Tooltip
