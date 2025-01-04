import clsx from 'clsx'

interface Props {
  children: React.ReactNode
  className?: clsx.ClassValue
}

export default function PageContent({ children, className }: Props) {
  return <div className={clsx('flex-1 overflow-scroll', className)}>{children}</div>
}
