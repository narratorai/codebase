import { ITableSchema } from '@narratorai/the-sequel'
import { MutableRefObject } from 'react'

export interface ISchemas {
  [schema: string]: ITableSchema[]
}

export interface IQueryTab {
  id: string
  title: string
  value: {
    sql: string
    notes?: string
  }
  closable: boolean
  editableFields?: 'notes'[]
  isNew: boolean // used to know if data will be loaded in automatically for the editor so that we can show a default state
  useMarkdownEditor?: boolean // if we want to force using a Markdown editor instead of the SQL editor
}

// an object with unknown keys, where every value is a ref where current is a function
export interface IEditorRefCollection {
  [key: string]: MutableRefObject<Function | undefined>
}

export interface IQueryWithScratchpadValue {
  current_query: {
    sql: string
  }
  scratchpad: any[]
}

export type SchemaSearchItem = {
  name: string
  data: ITreeBranch
}

export interface ITreeBranch {
  key: string
  title: string
  children?: ITreeBranch[]
}

export type HighlightData = [string, string, string] | string
