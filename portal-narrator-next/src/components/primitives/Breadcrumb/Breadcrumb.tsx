import { ChevronRightIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'

interface Props {
  children: React.ReactNode
  isRoot?: boolean
}

export default function Breadcrumb({ children, isRoot = false }: Props) {
  return (
    <li>
      <div className={clsx('flex items-center text-sm font-medium')}>
        {isRoot ? null : <ChevronRightIcon aria-hidden="true" className="mr-4 size-5 shrink-0 text-gray-400" />}
        {children}
      </div>
    </li>
  )
}
