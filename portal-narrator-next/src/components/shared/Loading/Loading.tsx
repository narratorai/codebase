import clsx from 'clsx'
import MavisIcon from 'static/mavis/icons/logo.svg'

interface Props {
  className?: string
}

const Loading = ({ className }: Props) => (
  <div className="h-full w-full justify-center flex-y-center">
    <MavisIcon className={clsx('animate-pulse', className)} />
  </div>
)

export default Loading
