import {
  CaretRightOutlined,
  FilterFilled,
  InfoCircleTwoTone,
  LineChartOutlined,
  LoadingOutlined,
  SortAscendingOutlined,
  TableOutlined,
} from '@ant-design/icons'
import { RadioChangeEvent } from 'antd/lib/radio/interface'
import { Badge, Button, Radio, Space, Tooltip } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { ACTION_TYPE_COUNT, ACTION_TYPE_QUERY } from 'components/Datasets/BuildDataset/datasetReducer'
import RunningTimer from 'components/Datasets/BuildDataset/RunningTimer'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { find, get, includes, isEmpty, map } from 'lodash'
import pluralize from 'pluralize'
import { useContext, useState } from 'react'
import styled from 'styled-components'
import { colors, semiBoldWeight } from 'util/constants'
import {
  FILTER_KIND_COLUMN,
  getGroupFromContext,
  getLabelFromOperatorValue,
  makeFilterValueString,
  RAW_DATASET_KEY,
  TOOL_GROUP_PARENT_FILTER,
  TOOL_ORDER_BY,
} from 'util/datasets'
import { IDatasetFormContext, IRequestApiData, viewTypeConstants } from 'util/datasets/interfaces'
import { commaify } from 'util/helpers'

import HideDuplicateParentColumnsPopover from './tools/HideDuplicateParentColumnsPopover/HideDuplicatParentColumnsPopover'

const SummaryPanelWrapper = styled(Box)<{ drawerVisible?: boolean }>`
  position: relative;
  z-index: 1;
  background-color: ${({ theme }) => theme.colors.white};
  box-shadow: ${({ drawerVisible }) => (drawerVisible ? 'none' : '0 0 10px 1px rgba(0, 0, 0, 0.1)')};
`

interface Props {
  drawerVisible: boolean
  cancelRunDataset: Function
  cancelRunCount: Function
}

const DatasetTabCTA = ({ drawerVisible, cancelRunDataset, cancelRunCount }: Props) => {
  const company = useCompany()
  const { machineCurrent, machineSend, groupSlug, onOpenToolOverlay, selectedApiData, onRunDataset } =
    useContext<IDatasetFormContext>(DatasetFormContext) || {}

  const group = getGroupFromContext({ context: machineCurrent.context, groupSlug })
  const plotCount = (group?.plots || []).length || 0

  const view = machineCurrent.context._view
  const hasActivities = (machineCurrent.context.activities || []).length > 0
  const staleTabs = machineCurrent.context._stale_tabs
  const hasStaleTabs = includes(staleTabs, groupSlug || RAW_DATASET_KEY)
  const isDuplicateParentGroup = machineCurrent.context._is_parent_duplicate

  const [tooltipVisible, setTooltipVisible] = useState(hasStaleTabs)

  const queryData = get(selectedApiData, ACTION_TYPE_QUERY, {} as IRequestApiData)
  const countData = get(selectedApiData, ACTION_TYPE_COUNT, {} as IRequestApiData)

  const datasetQueryLoading = get(queryData, 'loading')
  const datasetCountLoading = get(countData, 'loading')

  const onChangeRadio = (event: RadioChangeEvent) => {
    machineSend('SWITCH_MAIN_VIEW', { view: event.target.value })
  }

  const onSubmit = () => {
    onRunDataset()
    setTooltipVisible(false)
  }

  const totalRows = selectedApiData?.total_rows

  const renderRunButton = () =>
    datasetQueryLoading || datasetCountLoading ? (
      <Button
        type="primary"
        danger
        data-test="cancel-run-dataset-cta"
        onClick={() => {
          if (datasetQueryLoading) {
            cancelRunDataset()
          }

          if (datasetCountLoading) {
            cancelRunCount()
          }
        }}
        icon={<LoadingOutlined />}
      >
        Cancel
      </Button>
    ) : (
      <Button
        type="primary"
        disabled={!hasActivities}
        onClick={onSubmit}
        icon={<CaretRightOutlined />}
        data-test="run-dataset-cta"
      >
        Run
      </Button>
    )

  return (
    <SummaryPanelWrapper p={3} drawerVisible={drawerVisible} data-test="dataset-tab-cta">
      <Flex mb={2} justifyContent="space-between" alignItems="baseline">
        {hasStaleTabs ? (
          <Tooltip
            placement="right"
            title="Please re-run query to apply changes"
            open={tooltipVisible}
            onOpenChange={(visible) => setTooltipVisible(visible && hasStaleTabs)}
          >
            <Badge count={<InfoCircleTwoTone twoToneColor="#cc504b" />}>{renderRunButton()}</Badge>
          </Tooltip>
        ) : (
          renderRunButton()
        )}

        <Radio.Group value={view} onChange={onChangeRadio} disabled={!hasActivities} buttonStyle="solid">
          <Radio.Button value={viewTypeConstants.TABLE}>
            <TableOutlined />
          </Radio.Button>
          <Radio.Button value={viewTypeConstants.SQL}>
            <Typography as="code" type="body300" data-test="dataset-tab-sql-cta">
              SQL
            </Typography>
          </Radio.Button>
          <Radio.Button
            value={viewTypeConstants.PLOT}
            disabled={!hasActivities || !groupSlug || isDuplicateParentGroup}
          >
            <LineChartOutlined data-test="dataset-tab-plot-cta" />
            <Badge
              count={plotCount}
              style={{
                position: 'absolute',
                top: -27,
                right: -25,
                backgroundColor: colors.blue500,
              }}
            />
          </Radio.Button>
        </Radio.Group>
      </Flex>

      <Flex alignItems="center" justifyContent="space-between">
        <Typography as="div" type="title400" fontWeight={semiBoldWeight}>
          {datasetQueryLoading ? (
            <RunningTimer onCancel={cancelRunDataset} showCancel={false} {...queryData} />
          ) : (
            <span>
              <strong>{`${totalRows ? commaify(totalRows) : '--'}`}</strong> rows
            </span>
          )}
        </Typography>

        <Space>
          {group && (
            <Tooltip title="Pre-filter parent columns">
              <Button size="small" onClick={() => onOpenToolOverlay({ toolType: TOOL_GROUP_PARENT_FILTER })}>
                <FilterFilled
                  data-test="parent-filter-cta"
                  style={{
                    color: !isEmpty(group?.parent_filters) ? colors.blue500 : colors.gray700,
                  }}
                />
              </Button>
            </Tooltip>
          )}

          <Tooltip title="Order table rows">
            <Button size="small" onClick={() => onOpenToolOverlay({ toolType: TOOL_ORDER_BY })}>
              <SortAscendingOutlined style={{ color: colors.gray700 }} />
            </Button>
          </Tooltip>

          {isDuplicateParentGroup && <HideDuplicateParentColumnsPopover />}
        </Space>
      </Flex>

      {get(group, 'parent_filters', []).length > 0 && (
        <Box mt={2} p={2} bg="blue100">
          <Typography as="span" color="blue800">
            Pre-filter parent columns
          </Typography>
          {map(group?.parent_filters || [], (preFilter, index) => {
            // show the selected parent filters
            const column = find(machineCurrent.context.columns, (col) => col.id === preFilter.column_id)
            const pluralizeOperator = pluralize.isPlural(column?.label || '')
            const operatorLabel = getLabelFromOperatorValue(preFilter.filter.operator, pluralizeOperator)
            const isColumnKind = preFilter.filter.kind === FILTER_KIND_COLUMN

            const filterValueLabel = isColumnKind
              ? // if kind is column_id, use the column's label
                find(machineCurrent.context.columns, ['id', preFilter.filter.value])?.label
              : // otherwise use the value in the filter
                makeFilterValueString(preFilter.filter.value, company.timezone)

            if (column?.label) {
              return (
                <Typography as="span" type="body200" color="blue800" key={preFilter.column_id}>
                  {' '}
                  {index > 0 && `AND `}
                  WHERE <strong>{column.label}</strong> {operatorLabel} <strong>{filterValueLabel}</strong>
                </Typography>
              )
            }
          })}
        </Box>
      )}
    </SummaryPanelWrapper>
  )
}

export default DatasetTabCTA
