import clsx from 'clsx'
import React, { useContext } from 'react'

import * as ScrollArea from '@/components/shared/ScrollArea'

import Context from './Context'

interface Props {
  children: React.ReactNode
  onScroll?: (event: React.UIEvent) => void
  className?: string
}

const ContentScrollArea = ({ onScroll, className, children }: Props) => {
  const { initiateFocus, handleKeyboardEvent } = useContext(Context)

  return (
    <ScrollArea.Root
      className="popover__content__height min-w-40 max-w-xl"
      onKeyDown={handleKeyboardEvent}
      onFocus={initiateFocus}
    >
      <ScrollArea.Viewport onScroll={onScroll}>
        <ul className={clsx(className)}>{children}</ul>
      </ScrollArea.Viewport>
      <ScrollArea.VerticalScrollbar />
    </ScrollArea.Root>
  )
}

export default ContentScrollArea
