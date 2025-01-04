import { isNil } from 'lodash'

import { Button } from '../Button'

type Props = React.PropsWithChildren<{ href?: string | null }>

const PaginationNext = ({ children = 'Next', href }: Props) => {
  const buttonProps = isNil(href) ? { disabled: true } : { href }

  return (
    <span className="flex grow basis-0 justify-end">
      <Button {...buttonProps} aria-label="Next page" plain>
        {children}
        <svg aria-hidden="true" className="stroke-current" data-slot="icon" fill="none" viewBox="0 0 16 16">
          <path
            d="M13.25 8L2.75 8M13.25 8L10.75 10.5M13.25 8L10.75 5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
          />
        </svg>
      </Button>
    </span>
  )
}

export default PaginationNext
