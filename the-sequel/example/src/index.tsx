/* eslint-disable import/first */

// Setup Monaco workers w/out webpack plugin
// @ts-ignore
window.MonacoEnvironment = {
  // baseUrl: require.resolve('@narratorai/the-sequel/dist'),
  // baseUrl: 'http://localhost:8886/public/moncaco',// __webpack_public_path__,
  // @ts-ignore
  getWorkerUrl: function (_, label) {
    // NOTE Specific languages have workers that can be loaded, make sure they get into this list if we add more to the-sequel
    const languageLabels = ['json']
    if (languageLabels.includes(label)) {
      return require(`file-loader?esModule=false&outputPath=static/js/monaco&name=[name].[contenthash].[ext]!@narratorai/the-sequel/dist/${label}.worker.js`)
    } else {
      // Otherwise load the main editor worker
      return require(`file-loader?esModule=false&outputPath=static/js/monaco&name=[name].[contenthash].[ext]!@narratorai/the-sequel/dist/editor.worker.js`)
    }
  },
}

import {
  BasicEditor,
  IAutocomplete,
  IBasicCompletionDefinition,
  ICompletionResult,
  MarkdownSqlEditor,
  SqlCompletionService,
} from '@narratorai/the-sequel'
import _ from 'lodash'
import { useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ICompletionContext, ProviderResult } from '../../dist/autocomplete/autocompleteInterfaces'
import { IPosition, ITextModel } from '../../dist/autocomplete/textInterfaces'
import { ITableData } from './DataTable/DataTable'
import EditorWithTable from './DataTable/EditorWithTable'

//
// Warehouse autocomplete
//

function loadAutocomplete(json: any) {
  function loadSchemas() {
    let schemas = Object.keys(json.warehouse)
    let warehouse = json.warehouse
    return [schemas, warehouse]
  }

  function loadFunctions() {
    return require('./functionsAutocomplete.json').all_functions
  }

  const [schemas, warehouse] = loadSchemas()
  const functions = loadFunctions()

  return new SqlCompletionService({
    getSchemas: () => schemas,
    getTables: (schema: string) => {
      const tables = warehouse[schema]
      if (tables) {
        return tables.map((table: any) => table.table_name)
      }
      return []
    },
    getColumns: (schemaName: string, tableName: string) => {
      const tables = warehouse && warehouse[schemaName]
      if (tables) {
        const table = tables.find((entry: any) => entry.table_name === tableName)
        if (table) {
          return table.columns
        }
      }
      return []
    },
    getFunctions: () => functions,
  })
}

class PromiseCompletionService implements IAutocomplete {
  provideCompletionItems(
    content: ITextModel,
    position: IPosition,
    context: ICompletionContext
  ): ProviderResult<ICompletionResult> {
    const range = {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: content.getWordUntilPosition(position).startColumn,
      endColumn: position.column,
    }

    return new Promise<ICompletionResult>((resolve) => {
      return _.delay(
        () =>
          resolve({
            suggestions: [
              {
                label: 'New item',
                insertText: 'New',
                kind: 4,
                range,
              },
            ],
          }),
        2000
      )
    })
  }
}

const autoComplete = loadAutocomplete(require('./schemaAutocomplete.json')) // standard SQL completion
const snowflakeAutocomplete = loadAutocomplete(require('./snowflakeSchema.json')) // snowflake-flavor autocomplete: table names are DATABASE.SCHEMA.TABLE
const bigQueryAutocomplete = loadAutocomplete(require('./bigquerySchema.json')) // bigquery-flavor autocomplete: table names are project.dataset.table
const basicAutocomplete = require('./basicAutocomplete.json').autocomplete as IBasicCompletionDefinition[] // markdown completion

const App = () => {
  const [markdownValue, setMarkdownValue] = useState<string | undefined>('# This is a header with a {#variable}')
  const markdownValueRef = useRef<() => any | undefined>()

  // used to show that a ref passed to the markdown sql editor works
  function showMarkdownValue() {
    if (markdownValueRef.current) {
      alert(markdownValueRef.current())
    }
  }

  async function runQuery(sql: string) {
    // pretend to send send the raw sql data to a server
    console.log(sql)

    // load a query
    const json = require('./sampleQuery.json')
    const query = json.query_result.data

    const result = {
      columns: query.columns.map((column: any) => column.friendly_name),
      rows: query.rows,
    }
    return result as ITableData
  }

  return (
    <div>
      <h2>BigQuery SQL Editor</h2>
      <div style={{ border: '1px solid #ccc', height: '200px' }}>
        <MarkdownSqlEditor
          initialValue={
            '# BigQuery has an interesting schema \n```sql\nselect * from e-topic-234517.narrator.activity_stream a\nlimit 10\n```'
          }
          // null runQuery
          autoComplete={bigQueryAutocomplete}
          height={'100%'}
        />
      </div>

      <h2>Snowflake SQL Editor</h2>
      <div style={{ border: '1px solid #ccc', height: '200px' }}>
        <MarkdownSqlEditor
          initialValue={
            '# Snowflake has an interesting schema \n```sql\nselect * from DB.NARRATOR.ACTIVITY_STREAM a\nlimit 10\n```'
          }
          runQuery={(query) => console.log('run query from editor: ' + query)}
          autoComplete={snowflakeAutocomplete}
          height={'100%'}
        />
      </div>

      <h2>Markdown SQL Editor</h2>
      <div style={{ border: '1px solid #ccc', height: '200px' }}>
        <MarkdownSqlEditor
          initialValue={
            '# This is a component with Markdown and embedded SQL editing \n```sql\nselect * from dw.activity_stream\nlimit 10\n```'
          }
          runQuery={(query) => console.log('run query from editor: ' + query)}
          autoComplete={autoComplete}
          height={'100%'}
          getValueRef={markdownValueRef}
        />
        <button onClick={showMarkdownValue}>Check Value</button>
      </div>

      <h2>Python Editor</h2>
      <div style={{ border: '1px solid #ccc', height: '200px' }}>
        <BasicEditor
          language="python"
          defaultValue={'def hello(name):\n\tprint(f"Hello {name}")'}
          maxAutoHeight={200}
          autoComplete={new PromiseCompletionService()}
        />
      </div>

      <h2>JSON</h2>
      <div style={{ border: '1px solid #ccc' }}>
        <BasicEditor
          language="json"
          maxAutoHeight={200}
          options={{
            folding: true,
          }}
          defaultValue={JSON.stringify(
            {
              test: {
                this: 'value',
              },
            },
            null,
            2
          )}
        />
      </div>

      <h2>Markdown</h2>
      <div
        style={{
          border: '1px solid #ccc',
          width: '100%',
          maxWidth: '600px',
          minWidth: '500px',
        }}
      >
        <BasicEditor
          language="markdown"
          autoComplete={basicAutocomplete}
          value={markdownValue}
          onChange={setMarkdownValue}
          width={'100%'}
        />
      </div>

      <h2>Sql Editor</h2>
      <div style={{ border: '1px solid #ccc' }}>
        <EditorWithTable runQuery={runQuery} autoComplete={autoComplete} />
      </div>
    </div>
  )
}

const root = createRoot(document.getElementById('root')!)
// @ts-ignore
root.render(<App />)
