import clsx from 'clsx'

interface Props {
  children: React.ReactNode
  className?: clsx.ClassValue
}

export default function PageHeader({ children, className }: Props) {
  return <header className={clsx('h-16 px-10 py-3 bordered-b-gray-200', className)}>{children}</header>
}
