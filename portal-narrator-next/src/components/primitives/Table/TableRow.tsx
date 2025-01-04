'use client'

import clsx from 'clsx'
import { useContext } from 'react'

import { ITableRowContext } from './interfaces'
import TableContext from './TableContext'
import TableRowContext from './TableRowContext'

type Props = ITableRowContext & React.ComponentPropsWithoutRef<'tr'>

const TableRow = ({ href, target, title, ...props }: Props) => {
  const { striped } = useContext(TableContext)

  return (
    <TableRowContext.Provider value={{ href, target, title } as React.ContextType<typeof TableRowContext>}>
      <tr
        className={clsx(
          href &&
            'has-[[data-row-link][data-focus]]:outline has-[[data-row-link][data-focus]]:outline-2 has-[[data-row-link][data-focus]]:-outline-offset-2 has-[[data-row-link][data-focus]]:outline-blue-500 dark:focus-within:bg-white/[2.5%]',
          striped && 'even:bg-zinc-950/[2.5%] dark:even:bg-white/[2.5%]',
          href && striped && 'hover:bg-zinc-950/5 dark:hover:bg-white/5',
          href && !striped && 'hover:bg-zinc-950/[2.5%] dark:hover:bg-white/[2.5%]'
        )}
        {...props}
      />
    </TableRowContext.Provider>
  )
}

export default TableRow
