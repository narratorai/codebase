type Props = React.ComponentPropsWithoutRef<'nav'>

const Navbar = (props: Props) => <nav className="flex flex-1 items-center gap-4 py-3" {...props} />

export default Navbar
