type Props = React.ComponentPropsWithoutRef<'dt'>

const DescriptionTerm = (props: Props) => (
  <dt
    {...props}
    className="col-start-1 border-t border-zinc-950/5 pt-3 text-zinc-500 first:border-none sm:border-t sm:border-zinc-950/5 sm:py-3 dark:border-white/5 dark:text-zinc-400 sm:dark:border-white/5"
  />
)

export default DescriptionTerm
