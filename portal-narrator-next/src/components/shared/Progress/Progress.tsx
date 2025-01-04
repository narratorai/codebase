import clsx from 'clsx'

interface Props {
  percent: number
  orientation?: 'horizontal' | 'vertical'
}

const Progress = ({ percent, orientation = 'horizontal' }: Props) => {
  const container = orientation === 'horizontal' ? 'w-full h-1' : 'w-1 h-full rotate-180'
  const fill = orientation === 'horizontal' ? 'h-1' : 'w-1'
  const axis = orientation === 'horizontal' ? 'width' : 'height'

  return (
    <div className={clsx('overflow-hidden rounded-full bg-gray-200', container)}>
      <div
        className={clsx('relative rounded-full bg-purple-600 transition-all duration-500 ease-ease-in-out', fill)}
        style={{ [axis]: `${percent}%` }}
      />
    </div>
  )
}

export default Progress
