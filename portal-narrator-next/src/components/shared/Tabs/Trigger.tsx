import type { TabsTriggerProps } from '@radix-ui/react-tabs'
import * as Tabs from '@radix-ui/react-tabs'
import React, { useContext, useEffect } from 'react'

import Context from './Context'
import { useMeasure } from './hooks'

type TriggerProps = TabsTriggerProps & React.RefAttributes<HTMLButtonElement>

interface Props extends TriggerProps {
  children: React.ReactNode
}

const Trigger = ({ children, ...props }: Props) => {
  const [button, { width, height, top, left }] = useMeasure<HTMLButtonElement>()
  const { activeValue, setActiveTriggerDimensions } = useContext(Context)
  const { value } = props

  useEffect(() => {
    if (activeValue === value) {
      setActiveTriggerDimensions({ width, height, top, left })
    }
  }, [value, activeValue])

  return (
    <Tabs.Trigger {...props} ref={button}>
      {children}
    </Tabs.Trigger>
  )
}

export default Trigger
