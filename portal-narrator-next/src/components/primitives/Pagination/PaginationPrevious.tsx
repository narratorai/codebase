import { Button } from '../Button'

type Props = React.PropsWithChildren<{ href?: string | null }>

const PaginationPrevious = ({ children = 'Previous', href = null }: Props) => {
  const buttonProps = href === null ? { disabled: true } : { href }

  return (
    <span className="grow basis-0">
      <Button {...buttonProps} aria-label="Previous page" plain>
        <svg aria-hidden="true" className="stroke-current" data-slot="icon" fill="none" viewBox="0 0 16 16">
          <path
            d="M2.75 8H13.25M2.75 8L5.25 5.5M2.75 8L5.25 10.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
          />
        </svg>
        {children}
      </Button>
    </span>
  )
}

export default PaginationPrevious
