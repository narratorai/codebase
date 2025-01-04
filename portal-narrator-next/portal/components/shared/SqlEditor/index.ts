import EditorWithTable from './EditorWithTable'
import FullscreenEditor from './FullscreenEditor'
import SqlEditor from './SqlEditor'
import useQueryService from './services/useQueryService'
import useSqlAutocomplete from './services/useSqlAutocomplete'
import { MutableRefObject } from 'react'

export type FunctionNoArgs = () => any
export type FunctionRef = MutableRefObject<FunctionNoArgs | undefined>

export { FullscreenEditor, EditorWithTable, SqlEditor, useQueryService, useSqlAutocomplete }
