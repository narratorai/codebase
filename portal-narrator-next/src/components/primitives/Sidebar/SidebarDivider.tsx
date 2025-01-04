type Props = React.ComponentPropsWithoutRef<'hr'>

const SidebarDivider = (props: Props) => (
  <hr className="my-4 border-t border-gray-950/15 lg:-mx-4 dark:border-white/15" {...props} />
)

export default SidebarDivider
