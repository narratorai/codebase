'use client'

import { useEffect } from 'react'

import { hideBeaconWidgetIcon, showBeaconWidgetIcon } from '@/util/helpscout'

interface Props {
  children: React.ReactNode
  hideChatWidget?: boolean
}

export default function Page({ children, hideChatWidget = false }: Props) {
  useEffect(() => {
    if (hideChatWidget) hideBeaconWidgetIcon()

    return () => {
      showBeaconWidgetIcon()
    }
  }, [hideChatWidget])

  return <div className="overflow-y-scroll flex-y">{children}</div>
}
