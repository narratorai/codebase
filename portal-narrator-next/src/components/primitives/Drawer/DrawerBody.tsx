interface Props {
  children: React.ReactNode
}

const DrawerBody = ({ children }: Props) => <div className="relative flex-1 px-4 sm:px-6">{children}</div>

export default DrawerBody
