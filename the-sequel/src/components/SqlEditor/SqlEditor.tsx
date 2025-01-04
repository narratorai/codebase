import React, { MutableRefObject } from 'react'
import SqlEditorBase from './SqlEditorBase'
import { EditorApi } from '.././BasicEditor'
import { IAutocomplete } from '../..';
import monaco from '../../monaco'

// Component to wrap the MonacoEditor, set good defaults
// and provide a more abstract interface for
// a SQL editor. 

// Note: we purposely don't expose the direct contents of the editor to parent components.
//       it's only sent over on save.
//       The main contract between them is a query to run.

export interface SqlEditorProps {
  getQueryRef?: MutableRefObject<Function | undefined>
  getValueRef?: MutableRefObject<Function | undefined>
  runQuery?(sql: string) : void            // called when the user hits command-enter to run a query
  saveContents?(inputValue: string): void  // called when the user hits command-s to save
  autoComplete? : IAutocomplete
  onFocus?(): void
  onBlur?(value: string | undefined): void
  width? : number | string
  height? : number | string
  initialValue?: string
  options?: monaco.editor.IEditorConstructionOptions
  theme?: string
  editorRef?: MutableRefObject<EditorApi | undefined>
}

const SqlEditor: React.FC<SqlEditorProps> = ({...props}) => {
  return (
    <SqlEditorBase
      {...props}
      language="redshift"
    />
  )
}

export default SqlEditor
