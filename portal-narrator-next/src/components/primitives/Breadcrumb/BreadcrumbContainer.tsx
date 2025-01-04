interface Props {
  children: React.ReactNode
}

export default function BreadcrumbContainer({ children }: Props) {
  return (
    <nav aria-label="Breadcrumb" className="flex">
      <ol className="flex items-center space-x-4">{children}</ol>
    </nav>
  )
}
