import { useLazyQuery } from '@apollo/client'
import DataTable from 'components/shared/DataTable/DataTable'
import { DEFAULT_SCRATCHPAD } from 'components/shared/DynamicForm/Fields/QueryWithScratchpad/QueryWithScratchPadEditor'
import { LayoutContent } from 'components/shared/layout/LayoutWithFixedSider'
import MarkdownEditor from 'components/shared/MarkdownEditor'
import Page from 'components/shared/Page'
import { EditorWithTable, FunctionNoArgs, useSqlAutocomplete } from 'components/shared/SqlEditor'
import useQueryService from 'components/shared/SqlEditor/services/useQueryService'
import { GetSharedSqlQueryDocument } from 'graph/generated'
import { useEffect, useRef, useState } from 'react'
import useQueryParams from 'util/useQueryParams'

import CopyLinkAlert from './CopyLinkAlert'
import QueryEditorSider from './QueryEditorSider'

function useSqlQuery({ query_id }: { query_id?: string }) {
  const [queryFromGraph, { data }] = useLazyQuery(GetSharedSqlQueryDocument, {
    variables: { query_id },
  })

  useEffect(() => {
    if (query_id) queryFromGraph()
  }, [query_id, queryFromGraph])

  return data?.company_sql_queries[0]?.sql || DEFAULT_SCRATCHPAD
}

const QueryEditor = () => {
  const autocomplete = useSqlAutocomplete()
  const queryService = useQueryService()
  const valueRef = useRef<FunctionNoArgs>()

  const [runAsAdmin, setRunAsAdmin] = useState(false)
  const [shareLink, setShareLink] = useState<string | null>(null)

  const [{ query_id, view }] = useQueryParams()

  // If query_id is in the query params, load the query into the editor
  const sqlQuery = useSqlQuery({ query_id: query_id as string })

  if (!autocomplete) {
    return null
  }

  return (
    <Page title="Query Editor | Narrator" breadcrumbs={[{ text: 'Query Editor' }]}>
      <QueryEditorSider
        valueRef={valueRef}
        setRunAsAdmin={setRunAsAdmin}
        queryService={queryService}
        setShareLink={setShareLink}
      />
      <LayoutContent style={{ padding: 0, background: 'white' }}>
        {queryService && (
          <EditorWithTable
            service={queryService}
            autoComplete={autocomplete}
            EditorComponent={MarkdownEditor}
            TableComponent={DataTable}
            initialEditorData={sqlQuery}
            runAsAdmin={runAsAdmin}
            getValueRef={valueRef}
            editorProps={view ? { initialIsEditing: false } : { initialIsEditing: true }}
          />
        )}

        {shareLink && (
          <div style={{ position: 'absolute', zIndex: 1, top: 8, left: 8 }}>
            <CopyLinkAlert link={shareLink} onClose={() => setShareLink(null)} />
          </div>
        )}
      </LayoutContent>
    </Page>
  )
}

export default QueryEditor
