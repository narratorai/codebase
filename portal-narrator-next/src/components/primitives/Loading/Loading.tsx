import clsx from 'clsx'
import MavisIcon from 'static/mavis/icons/logo.svg'

import { HEIGHTS, SIZES } from './constants'
import { ILoading } from './interfaces'

type Props = ILoading

const Loading = ({ label = 'Loading...', size = 'md' }: Props) => (
  <div
    aria-label={label}
    className={clsx('z-10 grid w-full place-items-center transition-all duration-300 ease-in-out', HEIGHTS[size])}
  >
    <MavisIcon className={clsx('animate-pulse', SIZES[size])} />
  </div>
)

export default Loading
