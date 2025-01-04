'use client'

import clsx from 'clsx'
import { useContext } from 'react'

import TableContext from './TableContext'

type Props = React.ComponentPropsWithoutRef<'th'>

const TableHeader = (props: Props) => {
  const { bleed, grid } = useContext(TableContext)

  return (
    <th
      className={clsx(
        'border-b border-b-zinc-950/10 px-4 py-2 font-medium first:pl-[var(--gutter,theme(spacing.2))] last:pr-[var(--gutter,theme(spacing.2))] dark:border-b-white/10',
        grid && 'border-l border-l-zinc-950/5 first:border-l-0 dark:border-l-white/5',
        !bleed && 'sm:first:pl-1 sm:last:pr-1'
      )}
      {...props}
    />
  )
}

export default TableHeader
