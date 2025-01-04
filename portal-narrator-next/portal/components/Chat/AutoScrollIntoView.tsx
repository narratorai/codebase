import React, { useLayoutEffect } from 'react'

interface Props {
  children: React.ReactNode
  block?: 'end' | 'start' | 'center' | 'nearest'
  scrollKey?: React.DependencyList
}

const AutoScrollIntoView = ({ children, scrollKey = [], block = 'end' }: Props) => {
  const contentRef = React.useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const scrollIntoView = () => contentRef.current?.scrollIntoView({ behavior: 'instant', block })
    setTimeout(scrollIntoView, 350)
  }, scrollKey)

  return <div ref={contentRef}>{children}</div>
}

export default AutoScrollIntoView
