import clsx from 'clsx'
import { useContext } from 'react'

import Context from './Context'

interface Props {
  containerClassName?: string
  indicatorClassName?: string
}

const Indicator = ({ containerClassName, indicatorClassName }: Props) => {
  const { activeTriggerDimensions } = useContext(Context)
  const { width, left } = activeTriggerDimensions
  const translate = Math.floor(left)

  return (
    <div className={clsx('h-[1px] w-full bg-gray-200', containerClassName)}>
      <div
        className={clsx(
          'ease-in-out absolute h-1 w-[1px] origin-left bg-purple-600 transition-transform duration-250',
          indicatorClassName
        )}
        style={{ transform: `translateY(-3px) translateX(${translate}px) scaleX(${width})` }}
      />
    </div>
  )
}

export default Indicator
