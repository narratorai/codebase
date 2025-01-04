type Props = React.ComponentPropsWithoutRef<'div'>

const SidebarBody = (props: Props) => (
  <div
    className="flex flex-1 flex-col overflow-y-auto p-4 [&>[data-slot=section]+[data-slot=section]]:mt-8"
    {...props}
  />
)

export default SidebarBody
