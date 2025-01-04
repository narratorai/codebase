'use client'

import clsx from 'clsx'

import { ITableContext } from './interfaces'
import TableContext from './TableContext'

type Props = Partial<ITableContext> & React.ComponentPropsWithoutRef<'div'>

const Table = ({ bleed = false, children, dense = false, grid = false, striped = false, ...props }: Props) => (
  <TableContext.Provider value={{ bleed, dense, grid, striped } as React.ContextType<typeof TableContext>}>
    <div className="flow-root">
      <div className="-mx-[--gutter] overflow-x-auto whitespace-nowrap" {...props}>
        <div className={clsx('inline-block min-w-full align-middle', !bleed && 'sm:px-[--gutter]')}>
          <table className="min-w-full text-left text-sm/6 text-zinc-950 dark:text-white">{children}</table>
        </div>
      </div>
    </div>
  </TableContext.Provider>
)

export default Table
