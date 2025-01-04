type Props = React.ComponentPropsWithoutRef<'code'>

// px-0.5 text-sm font-medium sm:text-[0.8125rem]
const Code = (props: Props) => (
  <code
    {...props}
    className="border border-[--light-border] bg-[--light-background] text-[--light-accent] dark:border-[--dark-border] dark:bg-[--dark-background] dark:text-[--dark-accent]"
    data-slot="text-code"
  />
)

export default Code
