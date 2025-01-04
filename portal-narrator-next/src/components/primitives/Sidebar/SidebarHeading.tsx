type Props = React.ComponentPropsWithoutRef<'h3'>

const SidebarHeading = ({ children, ...props }: Props) => (
  <h3 className="mb-1 px-2 text-xs/6 font-medium text-gray-500 dark:text-gray-600" {...props}>
    {children}
  </h3>
)

export default SidebarHeading
