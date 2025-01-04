import type React from 'react'

type Props = React.ComponentPropsWithoutRef<'nav'>

const Pagination = ({ 'aria-label': ariaLabel = 'Page navigation', ...props }: Props) => (
  <nav aria-label={ariaLabel} {...props} className="flex gap-x-2" />
)

export default Pagination
