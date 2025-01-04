import type { TabsProps } from '@radix-ui/react-tabs'
import * as Tabs from '@radix-ui/react-tabs'
import React, { useEffect, useState } from 'react'

import Context from './Context'
import { useDimensions } from './hooks'

type RootProps = TabsProps & React.RefAttributes<HTMLDivElement>

interface Props extends RootProps {
  children: React.ReactNode
}

const Root = ({ children, ...props }: Props) => {
  const { defaultValue, onValueChange } = props
  const { dimensions, setDimensions } = useDimensions()
  const [activeValue, setActiveValue] = useState<string | null>(null)

  const handleValueChange = (value: string) => {
    onValueChange?.(value)
    setActiveValue(value)
  }

  useEffect(() => {
    if (defaultValue === undefined) return
    setActiveValue(defaultValue)
  }, [defaultValue])

  useEffect(() => {
    if (activeValue === null) setDimensions({ width: 0, height: 0, top: 0, left: 0 })
  }, [activeValue])

  return (
    <Context.Provider
      value={{
        activeValue,
        activeTriggerDimensions: dimensions,
        setActiveTriggerDimensions: setDimensions,
      }}
    >
      <Tabs.Root {...props} className="relative" onValueChange={handleValueChange}>
        {children}
      </Tabs.Root>
    </Context.Provider>
  )
}

export default Root
