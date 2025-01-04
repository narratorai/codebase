import { SqlCompletionService, SqlEditor } from '@narratorai/the-sequel'
import { useRef, useState } from 'react'
import DataTable, { ITableData } from './DataTable'

// Component that sticks the table and sql editor together
// Not directly used by Portal at this point.

interface EditorWithTableProps {
  runQuery(sql: string): Promise<ITableData>
  autoComplete: SqlCompletionService
  theme?: string
}

const EditorWithTable = ({ runQuery, autoComplete, theme }: EditorWithTableProps) => {
  const [queryResult, setQueryResult] = useState<ITableData>({ columns: [], rows: [] })
  const [isLoading, setIsLoading] = useState<Boolean>(false)
  const [queryError, setQueryError] = useState<string | null>(null)

  const [initialValue, setInitialValue] = useState<string>(
    "select\n  name,\n  nullif ( reverse ( split_part ( reverse ( replace ( regexp_substr ( e.page_referrer , '//;[^/\\,=@\\+]+\\.[^/:;,\\\\(\\)]+' ) , '//' , '' ) ) , '.' , 2 ) ) , '' ) AS \"referring_domain\"\nfrom dw.activity_stream a\nlimit 10;\n\nselect * from dw.activity_stream"
  )

  const getQuery = useRef<Function>()
  const getValue = useRef<Function>()

  function onRunClicked() {
    if (getQuery.current) {
      const sql = getQuery.current()
      runQueryWrapper(sql)
    }
  }

  // called by the editor when the user runs a query from within the editor (cmd-enter usually)
  function onRunFromEditor(sql: string) {
    runQueryWrapper(sql)
  }

  // Sets up state, calls the passed-in runQuery to get the actual data
  // and updates the query result
  async function runQueryWrapper(sql: string) {
    if (sql) {
      console.log(`Running query: ${sql}`)
      let result = {
        columns: [] as string[],
        rows: [] as object[],
      }

      try {
        setIsLoading(true)
        setQueryError(null)
        result = await runQuery(sql)
      } catch (error) {
        let message
        if (error instanceof Error) message = error.message
        else message = String(error)

        console.log(`Error running query: ${message}`)
        setQueryError(message)
      }

      setIsLoading(false)
      setQueryResult(result)
    }
  }

  function onSaveFromEditor(text: string) {
    // this isn't hooked up
    console.log(`Saving \n${text}`)
  }

  function onSave() {
    if (getValue.current) {
      const value = getValue.current()
      console.log(`Saving \n${value}`)
    }
  }

  return (
    <div>
      <SqlEditor
        getQueryRef={getQuery}
        getValueRef={getValue}
        runQuery={onRunFromEditor}
        saveContents={onSaveFromEditor}
        autoComplete={autoComplete}
        initialValue={initialValue}
        height={300}
        theme={theme}
      />
      <div className="tools-container">
        <button className="run-button" onClick={onRunClicked}>
          Run
        </button>
        <button className="run-button" onClick={onSave}>
          Save
        </button>
        <div className="error-bar">{queryError}</div>
      </div>
      <div style={{ height: '400px' }}>
        <DataTable tableData={queryResult} isLoading={isLoading} />
      </div>
    </div>
  )
}

export default EditorWithTable
