import { Button } from '../Button'

type Props = React.PropsWithChildren<{ href: string; current?: boolean }>

const PaginationPage = ({ children, current = false, href }: Props) => {
  const buttonProps = current ? { disabled: true } : { href }
  const ariaCurrent = current ? 'page' : undefined

  return (
    <Button plain {...buttonProps} aria-current={ariaCurrent} aria-label={`Page ${children}`}>
      <span className="-mx-0.5 min-w-[1rem] text-center">{children}</span>
    </Button>
  )
}

export default PaginationPage
