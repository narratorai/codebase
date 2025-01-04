type Props = React.ComponentPropsWithoutRef<'span'>

const PaginationGap = ({ children = <>&hellip;</>, ...props }: Props) => (
  <span
    aria-hidden="true"
    className="w-[2.25rem] select-none text-center text-sm/6 font-semibold text-zinc-950 dark:text-white"
    {...props}
  >
    {children}
  </span>
)

export default PaginationGap
