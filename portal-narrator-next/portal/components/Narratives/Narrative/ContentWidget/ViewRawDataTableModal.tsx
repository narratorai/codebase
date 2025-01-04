import { Spin } from 'antd-next'
import { Modal } from 'components/antd/staged'
import DataTable from 'components/shared/DataTable/DataTable'
import DownloadCsvIcon from 'components/shared/DataTable/DownloadCsvIcon'
import { ITableData } from 'components/shared/DataTable/interfaces'
import { DynamicPlotWithContextMeta } from 'components/shared/DynamicPlotWithContext'
import { Box, Flex, Typography } from 'components/shared/jawns'
import ProgressLoader from 'components/shared/ProgressLoader'
import { isFinite, omit } from 'lodash'
import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { INarrativeTableContentMetaData } from 'util/blocks/interfaces'
import { IDatasetQueryDefinition } from 'util/datasets/interfaces'
import { commaify } from 'util/helpers'
import useCallMavis, { useLazyCallMavis } from 'util/useCallMavis'

const makeLoadingConfig = (isDashboard: boolean) => [
  {
    percent: 15,
    duration: 10,
    text: `Updating the underlying dataset with the filters and variables from this ${
      isDashboard ? 'Dashboard' : 'Analysis'
    }.`,
  },
  {
    percent: 30,
    duration: 20,
    text: 'Applying the filters to the data.',
  },
  {
    percent: 70,
    duration: 30,
    text: 'Running the query on your data warehouse.',
  },
  {
    percent: 90,
    duration: 45,
    text: 'The query is still running (this might take time due to load on your warehouse or size of the data).',
  },
]

const TableControls = styled(Flex)`
  @media print {
    display: none;
  }
`

interface DillIntoReturn {
  current_row_count: number
  dataset_limit: number
  staged_dataset: IDatasetQueryDefinition
  new_group_slug: string
  table_data: {
    columns: ITableData['columns']
    rows: ITableData['rows']
    retrieved_at: string
    metadata: INarrativeTableContentMetaData
  }
}

interface Props {
  onClose: () => void
  selectedData: Record<any, string>
  contextMeta: DynamicPlotWithContextMeta
  isDashboard?: boolean
}

// reduce height to stop table from overflowing modal
const TableWrapper = styled(Box)`
  height: calc(100% - 24px);
`

const ViewRawDataTableModal = ({ onClose, selectedData, contextMeta, isDashboard }: Props) => {
  const [rowCount, setRowCount] = useState<number | undefined>()

  // Get the table data
  const { response: viewRawDataResponse, loading: viewRawDataLoading } = useCallMavis<DillIntoReturn>({
    method: 'POST',
    path: '/v1/dataset/plot/drill_into',
    body: {
      plot_row: selectedData,
      dataset_slug: contextMeta.datasetSlug,
      dataset: contextMeta.dataset,
      group_slug: contextMeta.groupSlug,
      plot_slug: contextMeta.plotSlug,
      narrative_slug: contextMeta.narrativeSlug,
      upload_key: contextMeta.uploadKey,
    },
  })

  const responseMetadata = viewRawDataResponse?.table_data?.metadata
  const title = responseMetadata?.title
  const responseTableData = omit(viewRawDataResponse?.table_data, 'metadata')
  const queryDefinition = viewRawDataResponse?.staged_dataset
  const newGroupSlug = viewRawDataResponse?.new_group_slug
  const datasetLimit = viewRawDataResponse?.dataset_limit
  // currentRowCount represents number of rows under or equal to datasetLimit
  // (actual number of rows returned by query is 500 or less - to reduce lag)
  const currentRowCount = viewRawDataResponse?.current_row_count || 0

  const formattedViewRawDataTable = {
    tableData: responseTableData,
    metadata: responseMetadata,
    isLoading: false,
    queryDefinition: viewRawDataResponse?.staged_dataset,
    groupSlug: viewRawDataResponse?.new_group_slug,
  }

  const [getCount, { response: countResponse, loading: countLoading, cancel: cancelGetCount }] = useLazyCallMavis<{
    total_rows: number
  }>({ method: 'POST', path: '/v1/dataset/count' })

  // get row count (may have to fire request to mavis if at limit)
  useEffect(() => {
    // there was a successful reponse for table data
    if (queryDefinition && datasetLimit) {
      // if rows is less than the limit, set these rows
      if (currentRowCount < datasetLimit) {
        setRowCount(currentRowCount)
      }

      // if rows are equal to limit, fetch true row count
      if (currentRowCount === datasetLimit) {
        getCount({
          body: {
            dataset: queryDefinition,
            group_slug: newGroupSlug,
          },
        })
      }
    }
  }, [queryDefinition, newGroupSlug, datasetLimit, currentRowCount, getCount])

  // cleanup count request
  useEffect(() => {
    return () => {
      cancelGetCount()
    }
  }, [])

  // if we had to fetch row count
  // set that as row count
  useEffect(() => {
    if (countResponse?.total_rows) {
      setRowCount(countResponse?.total_rows)
    }
  }, [countResponse?.total_rows])

  const loadingBar = makeLoadingConfig(!!isDashboard)
  const showTable = responseTableData && !viewRawDataLoading
  return (
    <Modal
      data-test="group-metric-modal"
      title={
        <Flex alignItems="center">
          <Typography type="title400">View Raw Data</Typography>

          {isFinite(rowCount) && (
            <Flex>
              <Typography ml={3} mr={'4px'}>
                {' '}
                (Rows in Group:{' '}
              </Typography>
              <Spin spinning={countLoading}>
                <Typography>{commaify(rowCount)}</Typography>
              </Spin>
              <Typography>)</Typography>
            </Flex>
          )}
        </Flex>
      }
      open
      onCancel={onClose}
      footer={null}
      full
    >
      <Box style={{ height: '100%' }}>
        {/* Show table once there is data */}
        {showTable && (
          <>
            {/* Title/download */}
            <Flex justifyContent="space-between">
              <Typography ml={1} type="title400">
                {title}
              </Typography>

              <TableControls mb={1} justifyContent="flex-end" alignItems="center">
                <DownloadCsvIcon data={responseTableData} title={title} />
              </TableControls>
            </Flex>

            <TableWrapper>
              <DataTable {...formattedViewRawDataTable} />
            </TableWrapper>
          </>
        )}

        {/* Show loading state and progress */}
        {viewRawDataLoading && <ProgressLoader loading success={false} loadingBar={loadingBar} />}
      </Box>
    </Modal>
  )
}

export default ViewRawDataTableModal
