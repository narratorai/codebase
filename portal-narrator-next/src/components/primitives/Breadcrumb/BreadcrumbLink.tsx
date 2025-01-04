import Link from 'next/link'

import Breadcrumb from './Breadcrumb'

interface Props {
  children: React.ReactNode
  href: string
  isRoot?: boolean
}

export default function BreadcrumbLink({ children, href, isRoot = false }: Props) {
  return (
    <Breadcrumb isRoot={isRoot}>
      <Link className="text-sm font-medium text-gray-500 hover:text-gray-700" href={href}>
        {children}
      </Link>
    </Breadcrumb>
  )
}
