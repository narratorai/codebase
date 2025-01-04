type Props = React.ComponentPropsWithoutRef<'dd'>

const DescriptionDetails = (props: Props) => (
  <dd
    {...props}
    className="pb-3 pt-1 text-zinc-950 sm:border-t sm:border-zinc-950/5 sm:py-3 dark:text-white dark:sm:border-white/5 sm:[&:nth-child(2)]:border-none"
  />
)

export default DescriptionDetails
