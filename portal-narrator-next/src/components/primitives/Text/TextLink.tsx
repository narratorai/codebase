import { Link } from '../Link'

type Props = React.ComponentPropsWithoutRef<typeof Link>

const TextLink = (props: Props) => (
  <Link
    {...props}
    className="text-[--light-accent] underline decoration-[--light-decoration] data-[hover]:decoration-[--light-decoration-hover] dark:text-[--dark-accent] dark:decoration-[--dark-decoration] dark:data-[hover]:decoration-[--dark-decoration-hover]"
    data-slot="text-link"
  />
)

export default TextLink
