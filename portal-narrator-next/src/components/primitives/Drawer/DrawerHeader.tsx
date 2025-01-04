interface Props {
  children: React.ReactNode
}

const DrawerHeader = ({ children }: Props) => (
  <div className="px-4 sm:px-6">
    <div className="flex items-start justify-between gap-4">{children}</div>
  </div>
)

export default DrawerHeader
