import { Trigger } from '@radix-ui/react-dialog'
import React from 'react'

interface Props {
  children: React.ReactNode
}

export default function DialogTrigger({ children }: Props) {
  return <Trigger asChild>{children}</Trigger>
}
