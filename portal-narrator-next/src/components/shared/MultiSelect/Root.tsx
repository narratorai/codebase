import React, { useContext } from 'react'

import { Popover } from '@/components/shared/Popover'

import Context from './Context'

interface Props {
  children: React.ReactNode
}

const Root = ({ children }: Props) => {
  const { open } = useContext(Context)

  return <Popover open={open}>{children}</Popover>
}

export default Root
