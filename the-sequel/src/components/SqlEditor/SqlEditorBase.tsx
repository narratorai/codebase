import React, { useState, useEffect, useRef } from 'react'
import monaco from '../../monaco'

import currentQueryRange, { intersectWithSqlRange } from '../../autocomplete/SqlAutocomplete/queryFunctions';
import { IPosition, ITextModel } from '../../autocomplete/textInterfaces';
import BasicEditor from '../BasicEditor';
import { SqlEditorProps } from './SqlEditor';

// Base class for a SQL editor
// not intended to be used outside this library

// Handles sql autocomplete and query running for any sql
// in the editor, including if it's embedded in another language like Markdown
interface SqlEditorBaseProps extends SqlEditorProps {
  language: string
}

const SqlEditorBase: React.FC<SqlEditorBaseProps> = ({
  getQueryRef,
  getValueRef,
  runQuery,
  saveContents,
  autoComplete,
  onFocus,
  onBlur,
  width,
  height,
  initialValue,
  theme,
  language,
  options,
  editorRef
}) => {

  const monacoEditor = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  let [valueForSaving, setValueForSaving] = useState<string>()

  if (getQueryRef) {
    getQueryRef.current = getQuery;
  }
  if (getValueRef) {
    getValueRef.current = getValue;
  }

  // store last used decorations to be able to properly add and remove them
  let previousDecorations = useRef<string[]>([])


  useEffect(() => {
    // call the parent's save callback here instead of Monaco's key handler
    if (valueForSaving && saveContents) {
      saveContents(valueForSaving)
      setValueForSaving(undefined)
    }
  }, [valueForSaving])

  // update the value from the parent
  useEffect(() => {
    if (initialValue) {
      monacoEditor.current?.setValue(initialValue)
    }
  }, [initialValue])

  // Returns the current query based on the current cursor position
  function getQuery() : string
  {
    let query;

    const editor = monacoEditor.current;
    const model: ITextModel | null | undefined = editor?.getModel();
    const position = editor?.getPosition();

    if (model && position) {
      // Grab any highlighted text first and use that as the query
      let selectionRange = editor?.getSelection()
      let queryRange : monaco.IRange | null

      if (selectionRange && !selectionRange?.isEmpty()) {
        queryRange = intersectWithSqlRange(model, position, selectionRange)
      }
      else {
        // Find the current query nearest the cursor
        queryRange = currentQueryRange(model, position)
      }

      if (queryRange) {
        query = model.getValueInRange(queryRange)
      }
    }

    return query || '';
  }

  // Returns the entire current value of the editor
  function getValue(): string {
    const value = monacoEditor.current?.getValue()
    return value || '';
  }

  //
  // Initialization
  //

  function onLoaded(editor: monaco.editor.IStandaloneCodeEditor) : void {
    monacoEditor.current = editor;

    // Register Cmd-Enter to run a script
    if (runQuery) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        const sql = getQuery();
        runQuery(sql);
      });
    }

    // Register Cmd-S to save a script
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => {
      const value = getValue()
      if (value) {
        // set this and return so that we can call the parent's save function outside
        // of a Monaco callback
        setValueForSaving(value)
      }
    });

    editor.onDidChangeCursorPosition(handleCursorPositionChanged)
  }

  // generic debounce function
  let timeout: number
  function debounce(callback: Function, delay: number, param: any) {
    return function() {
      clearTimeout(timeout)
      timeout = setTimeout(callback, delay, param)
    }
  }


  function handleCursorPositionChanged(e: monaco.editor.ICursorPositionChangedEvent) {
    // updateQueryDecoration is quite expensive, so we wait for a half second of no user input
    debounce(updateQueryDecoration, 500, e.position)()
  }

  function updateQueryDecoration(position: IPosition) {
    // query decoration is the vertical bar next to the line numbers that shows the current query
    // that will execute

    const model = monacoEditor.current?.getModel()

    if (model) {
      const charCount = model.getValueLength()
      if (charCount > 5000) {
        // this can be slow on super long documents and therefore not worth running
        return
      }

      const fullRange = model.getFullModelRange()
      const queryRange = currentQueryRange(model, position)

       // If the query under the cursor isn't the entire editor then show query decorations on the side
       // to make it obvious which query will run
      if (queryRange && !fullRange.equalsRange(queryRange)) {
        // Note: we can also inspect the actual theme colors and get clever, but this is enough for now
        const themeName = (monacoEditor.current as any)?._themeService?.getColorTheme()?.themeName
        const themeStyle = themeName === 'vs-dark' ? 'dark' : 'light'

        const decorations = model.deltaDecorations(previousDecorations.current, [
          { range: queryRange, options: { isWholeLine: true, linesDecorationsClassName: `.query-vertical-decoration-${themeStyle}` }},
        ])

        previousDecorations.current = decorations
      } else if (previousDecorations.current.length > 0) {
        // clear old decorations if we didn't make some this time
        model.deltaDecorations(previousDecorations.current, [])
        previousDecorations.current = []
      }
    }
  }

  return (
    <BasicEditor
      width={width}
      height={height}
      language={language}
      autoComplete={autoComplete}
      onLoaded={onLoaded}
      theme={theme}
      options={{ 
        lineNumbersMinChars: 2,
        // word separators are for highlighting text. BigQuery: this removes - from the default list so that
        // my-project is selected as one word when double-clicked
        wordSeparators: '`~!@#$%^&*()=+.[{]}\\|;:\'",<>/?',
        wordWrap: 'off',
        ...options
      }}
      onFocus={onFocus}
      onBlur={onBlur}
      editorRef={editorRef}
    />
  )
}

export default SqlEditorBase;
