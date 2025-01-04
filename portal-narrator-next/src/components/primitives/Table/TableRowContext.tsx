'use client'

import { createContext } from 'react'

import { ITableRowContext } from './interfaces'

const TableRowContext = createContext<ITableRowContext>({
  href: undefined,
  target: undefined,
  title: undefined,
})

export default TableRowContext
