'use client'

import clsx from 'clsx'
import { useContext, useState } from 'react'

import { Link } from '../Link'
import TableContext from './TableContext'
import TableRowContext from './TableRowContext'

type Props = React.ComponentPropsWithoutRef<'td'>

const TableCell = ({ children, ...props }: Props) => {
  const { bleed, dense, grid, striped } = useContext(TableContext)
  const { href, target, title } = useContext(TableRowContext)
  const [cellRef, setCellRef] = useState<HTMLElement | null>(null)

  return (
    <td
      className={clsx(
        'relative px-4 first:pl-[var(--gutter,theme(spacing.2))] last:pr-[var(--gutter,theme(spacing.2))]',
        !striped && 'border-b border-zinc-950/5 dark:border-white/5',
        grid && 'border-l border-l-zinc-950/5 first:border-l-0 dark:border-l-white/5',
        dense ? 'py-2.5' : 'py-4',
        !bleed && 'sm:first:pl-1 sm:last:pr-1'
      )}
      ref={href ? setCellRef : undefined}
      {...props}
    >
      {href && (
        <Link
          aria-label={title}
          className="absolute inset-0 focus:outline-none"
          data-row-link
          href={href}
          tabIndex={cellRef?.previousElementSibling === null ? 0 : -1}
          target={target}
        />
      )}
      {children}
    </td>
  )
}

export default TableCell
