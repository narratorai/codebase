/* eslint-disable react/jsx-max-depth */
import { DownloadOutlined } from '@ant-design/icons'
import { IAutocomplete } from '@narratorai/the-sequel'
import { SqlEditorProps } from '@narratorai/the-sequel/dist/components/SqlEditor/SqlEditor'
import { App, Button, Flex, message, Space, Spin, Tooltip } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import ErrorBoundary from 'components/ErrorBoundary'
import { IDataTableProps } from 'components/shared/DataTable/interfaces'
import { Box, Typography } from 'components/shared/jawns'
import SimpleTimer from 'components/shared/SimpleTimer'
import { isString } from 'lodash'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import styled from 'styled-components'
import { downloadCsv } from 'util/download'
import { timeFromNow } from 'util/helpers'

import { FunctionNoArgs, FunctionRef } from '.'

/**
 * Panel container for the editor. Used to make sure the autocomplete menu is on top of
 * the table panel.
 */
export const StyledCodePanel = styled(Panel)`
  z-index: 99 !important;
  overflow: visible !important;
`

// TODO: fix monaco runAsAdmin thing... one fix: make a getref to a function as it changes and do it in monaco
export interface IQueryService {
  runQuery: (
    sql: string,
    asAdmin: boolean,
    asCsv?: boolean,
    runLive?: boolean,
    fields?: { current_script: string }
  ) => Promise<ITableResponse | string>
  cancelQuery: (sql: string) => Promise<void>
}

export interface IEditorComponentProps extends Omit<SqlEditorProps, 'initialValue'> {
  saveContents?: (value: any) => void
  onEditorFocus?: () => void
  onEditorBlur?: (value: string | undefined) => void
  initialValue?: any
  getFieldsRef?: FunctionRef
  readonly?: boolean
  editorContext?: object // unstructured data that is passed through to the editor from above
}

interface Props {
  EditorComponent: React.FC<IEditorComponentProps>
  TableComponent: React.FC<IDataTableProps>
  autoComplete: IAutocomplete
  service: IQueryService
  getValueRef?: FunctionRef // pass in a ref - it'll get attached to a function that returns the current editor value
  onEditorSave?(value: any): void
  onEditorFocus?(): void
  onEditorBlur?(value: string | undefined): void
  initialEditorData?: any
  runAsAdmin?: boolean
  editorContext?: object
  editorProps?: object // additional props to pass down
}

export interface ITableResponse {
  rows: object[]
  columns: string[]
  retrievedAt?: string
}

/**
 * Handles both an editor Sql Editor and Data Table with a resize handle in between
 *
 * The editor and table are passed in as render functions. This is done so that that we can vary how the editor behaves
 * without modifing this component
 *
 * Note on Query tabs
 * If we want to bring back query tabs we can do it outside this component. I.e. host an EditorWithTable per tab.
 * Otherwise we'd have to maintain view state which we don't have access to like scroll state of the editor and table.
 */
// eslint-disable-next-line max-lines-per-function
const EditorWithTable = ({
  service,
  EditorComponent,
  TableComponent,
  autoComplete,
  getValueRef,
  onEditorSave,
  onEditorFocus,
  onEditorBlur,
  initialEditorData,
  runAsAdmin,
  editorContext,
  editorProps,
}: Props) => {
  const { notification } = App.useApp()
  const company = useCompany()
  const [runningQuery, setRunningQuery] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [error, setError] = useState<{ message?: string } | null>()
  const [requestStartedAt, setRequestStartedAt] = useState<number>()
  const [response, setResponse] = useState<ITableResponse | undefined>()

  // requestCompletedAt - time the query request returned
  const [requestCompletedAt, setRequestCompletedAt] = useState<number>()

  // requestRetrievedAgo - last time the query was actually run (not cached)
  const [requestRetrievedAgo, setRequestRetrievedAgo] = useState<string>()

  const getQueryRef = useRef<FunctionNoArgs>()
  const getFieldsRef = useRef<FunctionNoArgs>()
  const loading = !!runningQuery

  // Run as admin
  //
  // this is a ref, not state, becaused it's used in handleRunQuery, which doesn't have access to current state when called
  // by the Monaco editor on cmd-enter (or more accurately, even if we wrap it in a useCallback, Monaco won't pick up the new
  // function and is always using the one that captured outdated state in its closure)
  const runAsAdminRef = useRef(false)

  useEffect(() => {
    if (runAsAdmin !== undefined) {
      runAsAdminRef.current = runAsAdmin
    }
  }, [runAsAdmin])

  // Keep response completed ago up-to-date
  useEffect(() => {
    const updateCompletedAgo = () => {
      if (response?.retrievedAt) {
        setRequestRetrievedAgo(timeFromNow(response?.retrievedAt, company?.timezone))
      }
    }

    // update every mintue
    const requestedAtAgoInterval = setInterval(updateCompletedAgo, 1000 * 60)

    return () => {
      clearInterval(requestedAtAgoInterval)
    }
  }, [response?.retrievedAt, company?.timezone])

  const runQuery = useCallback(
    async (runLive: boolean, providedSql: string | undefined) => {
      const sql = providedSql || (getQueryRef.current && getQueryRef?.current())

      if (!sql) {
        return notification.warning({
          key: 'no-sql-on-run',
          placement: 'topRight',
          message: 'Cursor must be on a sql query to run',
        })
      }

      // "fields" is used by Mavis
      // when running the query from the Markdown Editor
      let fields
      if (getFieldsRef?.current) {
        fields = getFieldsRef?.current()
      }

      if (sql && service) {
        try {
          setError(null)
          setLoaded(false)
          setRequestStartedAt(new Date().getTime())
          setRunningQuery(sql)

          const payload = await service.runQuery(sql, runAsAdminRef?.current || false, false, runLive, fields)
          // typescript check as runQuery can return a string for CSV download
          if (!isString(payload)) {
            setResponse(payload)
            // initialize the time ago text
            // (updateCompletedAgo will keep it up to date after that)
            setRequestRetrievedAgo(timeFromNow(payload?.retrievedAt, company?.timezone))
          }

          setLoaded(true)
        } catch (error) {
          setError(error as Error)
        }

        setRunningQuery(null)
        const requestCompletedAt = new Date().getTime()
        setRequestCompletedAt(requestCompletedAt)
      }
    },
    [service, company?.timezone]
  )

  const handleRunQuery = (sql?: string) => {
    runQuery(false, sql)
  }

  const handleCleareCacheAndRun = () => runQuery(true, undefined)

  const handleCancelQuery = async () => {
    if (runningQuery && service) {
      // Get currently running SQL query
      const sql = runningQuery

      try {
        const done = message.loading('canceling')
        setLoaded(false)
        setCanceling(true)

        await service.cancelQuery(sql)
        done()

        setResponse(undefined)
        setCanceling(false)
        setRunningQuery(null)
      } catch (error) {
        setError(error as Error)
      }

      setCanceling(false)
    }
  }

  const handleDownloadAsCsv = useCallback(async () => {
    if (getQueryRef?.current) {
      const sql = getQueryRef?.current()

      // "fields" is used by Mavis
      // when running the query from the Markdown Editor
      let fields
      if (getFieldsRef?.current) {
        fields = getFieldsRef?.current()
      }

      if (!sql) {
        return notification.warning({
          key: 'no-sql-on-download',
          placement: 'topRight',
          message: 'Cursor must be on a sql query to download',
        })
      }

      if (sql && service) {
        const notificationKey = `downloading_notification_${sql}`
        const fileName = `${company.slug}_query`

        try {
          notification.info({
            key: notificationKey,
            message: 'Preparing CSV for download',
            description: <Spin />,
            duration: 0,
          })

          const csvData = await service.runQuery(sql, false, true, undefined, fields)
          notification.destroy(notificationKey)
          downloadCsv({ csvData, fileName })
        } catch (error) {
          notification.destroy(notificationKey)
          notification.error({
            message: 'Error',
            description: (error as Error).message,
          })
        }
      }
    }
  }, [service, company, notification])

  const tableData = useMemo(
    () =>
      response
        ? {
            columns: response.columns.map((columnName) => {
              return { name: columnName }
            }),
            rows: response.rows,
          }
        : { columns: [], rows: [] },
    [response]
  )

  return (
    <Box pl={2} pr={2} bg="gray100" relative style={{ minHeight: 0, height: '100%' }}>
      <PanelGroup direction="vertical" autoSaveId="sql-editor-table">
        <StyledCodePanel minSize={15}>
          <Box bg="white" style={{ height: '100%' }}>
            <EditorComponent
              runQuery={handleRunQuery}
              getQueryRef={getQueryRef}
              getValueRef={getValueRef}
              getFieldsRef={getFieldsRef}
              autoComplete={autoComplete}
              initialValue={initialEditorData}
              saveContents={onEditorSave}
              onEditorFocus={onEditorFocus}
              onEditorBlur={onEditorBlur}
              editorContext={editorContext}
              height="100%"
              {...editorProps}
            />
          </Box>
        </StyledCodePanel>

        <PanelResizeHandle />
        <Panel minSize={15}>
          <Flex style={{ height: '100%', flexDirection: 'column' }}>
            <Flex gap={8} style={{ minHeight: '50px', alignItems: 'center' }}>
              <Button onClick={() => handleRunQuery()}>Run</Button>

              {loading && (
                <>
                  <Box mr={1}>
                    <Button onClick={handleCancelQuery} disabled={canceling}>
                      Cancel
                    </Button>
                  </Box>
                  <Box mx={1}>
                    {!canceling && (
                      <SimpleTimer requestStartedAt={requestStartedAt}>
                        {(displayTime: number) => <Typography type="body100">{displayTime} s</Typography>}
                      </SimpleTimer>
                    )}
                  </Box>
                </>
              )}

              {/* show 'completed' on successful run */}
              {loaded && !canceling && <Typography>Completed (data as of {requestRetrievedAgo})</Typography>}

              {error?.message && <Typography color="red500">{error?.message}</Typography>}

              <Box ml="auto" data-public>
                <Space>
                  <Flex>
                    {loaded && !canceling && (
                      <Button type="link" onClick={handleCleareCacheAndRun}>
                        Clear Cache
                      </Button>
                    )}
                    <Tooltip
                      placement="topRight"
                      title={
                        runAsAdmin ? (
                          'Only available in Non-Admin Mode'
                        ) : (
                          <Box>
                            <Typography>Download as CSV</Typography>
                            <Typography>(max 10,000 rows)</Typography>
                          </Box>
                        )
                      }
                    >
                      <Button disabled={runAsAdmin} onClick={handleDownloadAsCsv} icon={<DownloadOutlined />} />
                    </Tooltip>
                  </Flex>
                </Space>
              </Box>
            </Flex>

            {/* Table Output */}
            <div style={{ flex: 1 }} data-private>
              <ErrorBoundary>
                <TableComponent tableData={tableData} isLoading={loading} />
              </ErrorBoundary>
            </div>

            {/* Row count and final query run time */}
            <Flex gap={8} style={{ justifyContent: 'space-between', paddingTop: 12, paddingBottom: 12 }}>
              <Box>{response && <Typography type="body100">{response.rows.length} rows</Typography>}</Box>
              <Box>
                <SimpleTimer requestStartedAt={requestStartedAt} requestCompletedAt={requestCompletedAt}>
                  {(displayTime: number) => <Typography type="body100">{displayTime} s</Typography>}
                </SimpleTimer>
              </Box>
            </Flex>
          </Flex>
        </Panel>
      </PanelGroup>
    </Box>
  )
}

export default EditorWithTable
