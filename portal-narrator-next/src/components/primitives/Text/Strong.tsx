type Props = Omit<React.ComponentPropsWithoutRef<'strong'>, 'className'>

const Strong = (props: Props) => (
  <strong {...props} className="text-[--light-accent] dark:text-[--dark-accent]" data-slot="text-strong" />
)

export default Strong
