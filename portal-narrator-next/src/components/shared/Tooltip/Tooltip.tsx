import { Provider, Root } from '@radix-ui/react-tooltip'
import React from 'react'

interface Props {
  children: React.ReactNode
  open?: boolean
  defaultOpen?: boolean

  /** Event handler called when the open state of the tooltip changes. */
  onToggle?: (open: boolean) => void

  /** The duration from when the mouse enters a tooltip trigger until the tooltip opens. */
  delayDuration?: number

  /** Whether to show the tooltip or not. */
  disabled?: boolean
}

export default function Tooltip({ children, open, defaultOpen, onToggle, delayDuration = 0, disabled = false }: Props) {
  return (
    <Provider delayDuration={delayDuration}>
      <Root open={disabled ? false : open} defaultOpen={defaultOpen} onOpenChange={onToggle}>
        {children}
      </Root>
    </Provider>
  )
}
