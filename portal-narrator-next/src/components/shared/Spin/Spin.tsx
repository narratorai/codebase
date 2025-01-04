import clsx from 'clsx'
import LoadingIcon from 'static/mavis/icons/loading.svg'

interface Props {
  className?: string
}

const Spin = ({ className }: Props) => <LoadingIcon className={clsx('size-4 animate-spin', className)} />

export default Spin
