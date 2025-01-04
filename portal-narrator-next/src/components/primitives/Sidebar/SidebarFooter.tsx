type Props = React.ComponentPropsWithoutRef<'div'>

const SidebarFooter = (props: Props) => (
  <div
    className="flex flex-col border-t border-gray-950/15 p-4 dark:border-white/15 [&>[data-slot=section]+[data-slot=section]]:mt-2.5"
    {...props}
  />
)

export default SidebarFooter
