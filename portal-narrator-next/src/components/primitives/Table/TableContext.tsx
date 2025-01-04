'use client'

import { createContext } from 'react'

import { ITableContext } from './interfaces'

const TableContext = createContext<ITableContext>({
  bleed: false,
  dense: false,
  grid: false,
  striped: false,
})

export default TableContext
