type Props = React.ComponentPropsWithoutRef<'div'>

const NavbarDivider = (props: Props) => (
  <div aria-hidden="true" className="h-6 w-px bg-zinc-950/10 dark:bg-white/10" {...props} />
)

export default NavbarDivider
