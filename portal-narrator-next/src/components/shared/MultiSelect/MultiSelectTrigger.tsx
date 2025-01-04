import { Trigger as PopoverTrigger } from '@radix-ui/react-popover'
import { cloneElement, ReactElement, useContext } from 'react'

import Context from './Context'

interface Props {
  children: ReactElement
}

const MultiSelectTrigger = ({ children }: Props) => {
  const { selected, handleOpen } = useContext(Context)

  return (
    <PopoverTrigger onClick={handleOpen} className="w-full">
      {cloneElement(children, { selected })}
    </PopoverTrigger>
  )
}

export default MultiSelectTrigger
