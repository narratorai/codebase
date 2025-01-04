import {
  BlockOutlined,
  CaretDownOutlined,
  CloudDownloadOutlined,
  DeleteOutlined,
  EditOutlined,
  SortAscendingOutlined,
  UndoOutlined,
} from '@ant-design/icons'
import { Dropdown, Tooltip } from 'antd-next'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { ACTION_TYPE_QUERY } from 'components/Datasets/BuildDataset/datasetReducer'
import { Box } from 'components/shared/jawns'
import { get, isEmpty } from 'lodash'
import { useContext } from 'react'
import { RAW_DATASET_KEY } from 'util/datasets'
import { IDatasetFormContext, IDatasetQueryGroup, IRequestApiData } from 'util/datasets/interfaces'

interface Props {
  slug: string
  group?: IDatasetQueryGroup
  disableDownload: boolean
  handleDownload?: (param: any) => void
  handleDelete?: (param: any) => void
  handleDuplicate?: (param: any) => void
  handleRename?: (param: any) => void
  showRestoreColumnOrder: boolean
  handleRestoreColumnOrderDefaults?: (param: any) => void
  handleDuplicateParent?: () => void
}

const TabMenu = ({
  slug,
  group,
  disableDownload,
  handleDownload,
  handleRename,
  handleDuplicate,
  handleDelete,
  showRestoreColumnOrder,
  handleRestoreColumnOrderDefaults,
  handleDuplicateParent,
}: Props) => {
  const { machineSend, selectedApiData } = useContext<IDatasetFormContext>(DatasetFormContext) || {}

  const isKpiLockedGroup = !!group?.kpi_locked
  const isDuplicateParentGroup = !!group?.is_parent

  const queryData = get(selectedApiData, ACTION_TYPE_QUERY, {} as IRequestApiData)
  const datasetQueryLoading = get(queryData, 'loading')
  const columnMapping = selectedApiData?.column_mapping
  const disableQuickReorderColumns = isEmpty(columnMapping) || datasetQueryLoading

  const openQuickReorderMenu = () => {
    machineSend('EDIT_QUICK_REORDER_COLUMNS')
  }

  return (
    <Box ml={3} data-test="dataset-tab-menu">
      <Dropdown
        trigger={['click']}
        menu={{
          items: [
            {
              key: 'Download',
              disabled: disableDownload,
              onClick: handleDownload,
              icon: <CloudDownloadOutlined />,
              label: (
                <Tooltip
                  title={disableDownload ? 'Dataset is stale. Please run this dataset to download' : ''}
                  placement="right"
                >
                  <span data-test="download-csv-option">Download CSV</span>
                </Tooltip>
              ),
            },

            slug !== RAW_DATASET_KEY
              ? {
                  key: 'Rename',
                  onClick: handleRename,
                  icon: <EditOutlined />,
                  label: <span data-test="rename-group-option">Rename</span>,
                }
              : null,

            slug !== RAW_DATASET_KEY
              ? {
                  key: 'Duplicate Group',
                  onClick: handleDuplicate,
                  icon: <BlockOutlined />,
                  label: <span data-test="duplicate-group-option">Duplicate {!isDuplicateParentGroup && 'Group'}</span>,
                }
              : null,

            slug !== RAW_DATASET_KEY
              ? {
                  key: 'Delete',
                  disabled: isKpiLockedGroup,
                  onClick: handleDelete,
                  icon: <DeleteOutlined />,
                  label: (
                    <Tooltip
                      placement="right"
                      title={isKpiLockedGroup ? 'Cannot delete kpi created groups' : undefined}
                    >
                      <span data-test="delete-group-option">Delete</span>
                    </Tooltip>
                  ),
                }
              : null,

            {
              key: 'Quick Reorder Columns',
              disabled: disableQuickReorderColumns,
              onClick: openQuickReorderMenu,
              icon: <SortAscendingOutlined />,
              label: (
                <Tooltip
                  placement="right"
                  title={
                    datasetQueryLoading
                      ? 'Please wait until the dataset is finished loading'
                      : isEmpty(columnMapping)
                        ? 'Please run the dataset to reorder columns'
                        : undefined
                  }
                >
                  <span data-test="quick-reorder-columns-option">Quick Reorder Columns</span>
                </Tooltip>
              ),
            },

            showRestoreColumnOrder
              ? {
                  key: 'Return to default Column Order',
                  onClick: handleRestoreColumnOrderDefaults,
                  icon: <UndoOutlined />,
                  label: 'Restore Column Order Defaults',
                }
              : null,

            slug === RAW_DATASET_KEY
              ? {
                  key: 'Duplicate Parent',
                  onClick: handleDuplicateParent,
                  icon: <BlockOutlined />,
                  label: <span data-test="duplicate-parent-option">Duplicate Parent</span>,
                }
              : null,
          ],
        }}
      >
        <CaretDownOutlined style={{ marginRight: 0, fontSize: 12 }} />
      </Dropdown>
    </Box>
  )
}

export default TabMenu
