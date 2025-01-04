import { FunctionOutlined } from '@ant-design/icons'
import { Table } from 'antd-next'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { Box, Flex } from 'components/shared/jawns'
import { filter, find, includes, map, startsWith } from 'lodash'
import React, { useContext, useState } from 'react'
import Measure from 'react-measure'
import styled from 'styled-components'
import { IActivityColumnOptions } from 'util/datasets/interfaces'

import ActivityPuzzlePiece from './ActivityPuzzlePiece'
import CustomHeaderTitle from './CustomHeaderTitle'
import { IRelationshipTableConfig, IRelationshipTableRow } from './interfaces'

const TIMESTAMP_COLUMN_WIDTH = 100
const CUSTOMER_COLUMN_WIDTH = 90

const TableCellSkeleton = styled.div`
  background-color: ${({ theme }) => theme.colors.gray300};
  height: 26px;
  width: 100%;
`

const HighlightedCustomer = styled.div<{ highlighted?: boolean }>`
  font-weight: ${({ highlighted }) => (highlighted ? 'bold' : 'normal')};

  ::before {
    content: '';
    position: absolute;
    inset: 3px 3px 3px 0;
    border-radius: 4px;
    border: ${({ highlighted, theme }) => (highlighted ? `2px solid ${theme.colors.yellow500}` : 'none')};
  }
`

interface Props {
  appendActivityConfig: any
  appendActivityName: string
  cohortActivityConfig: any
  cohortActivityName: string
  customer: string
  fullTableType?: 'columns' | 'colspan'
  tableConfig: IRelationshipTableConfig
  tableRows: IRelationshipTableRow[]
}

const RelationshipAnimationTable = ({
  appendActivityConfig,
  appendActivityName,
  cohortActivityConfig,
  cohortActivityName,
  customer,
  fullTableType,
  tableConfig,
  tableRows,
}: Props) => {
  const [tableWidth, setTableWidth] = useState(0)
  const { machineCurrent } = useContext(DatasetFormContext)
  const { _definition_context: definitionContext } = machineCurrent.context

  ////////////////////////////////////////////////////////////////////////
  ////////////////// FULL TABLE WITH COLUMNS /////////////////////////////
  ////////////////// (Shows if props.fullTableType is present) ///////////
  ////////////////////////////////////////////////////////////////////////
  const cohortColumnOptions =
    find(definitionContext.column_options, {
      activity_ids: cohortActivityConfig.activity_ids,
      relationship_slug: null,
    }) || ({} as IActivityColumnOptions)
  const appendColumnOptions =
    find(definitionContext.column_options, {
      activity_ids: appendActivityConfig.activity_ids,
      relationship_slug: appendActivityConfig.relationship_slug,
    }) || ({} as IActivityColumnOptions)

  // Grab cohort column defaults (timestamp, customer, features 1 - 3)
  const cohortColumns = filter(cohortColumnOptions.select_options, (option) => {
    return startsWith(option.name, 'feature_') || includes(['customer', 'ts'], option.name)
  })
  // Grab user selected append columns, and use select_options equivalent for dropdown_name
  // (see AdditionalColumnSelect for similar logic)
  const userAppendColumns = filter(appendColumnOptions.select_options, (option) => {
    return includes(map(appendActivityConfig.columns, 'name'), option.name)
  })

  // If the user hasn't selected an Append/Join Activity yet, there won't be any columns,
  // so add a sample column so the table has something:
  const appendColumns =
    userAppendColumns.length === 0
      ? [
          {
            label: 'Sample Column',
            dropdown_label: 'Sample Column',
            name: 'sample_column',
          },
        ]
      : userAppendColumns

  // Calculate the width of each non timestamp or customer column
  // when fullTableType === 'columns'
  const cohortFeatureColumnsCount = cohortColumns.length - 2
  const appendFeatureColumnsCount = appendColumns.length
  const featureColumnWidth =
    (tableWidth - TIMESTAMP_COLUMN_WIDTH - CUSTOMER_COLUMN_WIDTH) /
    (cohortFeatureColumnsCount + appendFeatureColumnsCount)

  // Make antd Table column objects:
  const cohortTableColumns = map(cohortColumns, (column, index) => {
    if (column.name === 'ts') {
      return {
        title: <CustomHeaderTitle type="cohort">{column.dropdown_label || column.label}</CustomHeaderTitle>,
        dataIndex: 'timestamp',
        key: `${column.label}.${column.name}`,
        width: TIMESTAMP_COLUMN_WIDTH,
      }
    }
    if (column.name === 'customer') {
      return {
        title: <CustomHeaderTitle type="cohort">{column.dropdown_label || column.label}</CustomHeaderTitle>,
        dataIndex: 'customer',
        key: `${column.label}.${column.name}`,
        width: CUSTOMER_COLUMN_WIDTH,
      }
    }
    return {
      title: <CustomHeaderTitle type="cohort">{column.dropdown_label || column.label}</CustomHeaderTitle>,
      key: `${column.label}.${column.name}`,
      width: featureColumnWidth,
      render: () => ({
        children:
          fullTableType === 'columns' ? (
            <TableCellSkeleton />
          ) : (
            <ActivityPuzzlePiece noMaxWidth name={cohortActivityName} type="cohort" />
          ),
        props: {
          // Span the full width of all the cohort columns if we're in fullTableType 'colspan' mode
          colSpan: fullTableType === 'columns' ? 1 : index === 2 ? cohortFeatureColumnsCount : 0,
        },
      }),
    }
  })
  const appendTableColumns = map(appendColumns, (column, index) => ({
    title: <CustomHeaderTitle type="append">{column.dropdown_label || column.label}</CustomHeaderTitle>,
    key: `${column.label}.${column.name}`,
    width: featureColumnWidth,
    render: () => ({
      children: <ActivityPuzzlePiece noMaxWidth name={appendActivityName} type="unknown" />,
      props: {
        colSpan: fullTableType === 'columns' ? 1 : index === 0 ? appendFeatureColumnsCount : 0,
      },
    }),
  }))

  // Merge the cohort and append columns, and we're done!
  const fullTableColumns = [...cohortTableColumns, ...appendTableColumns]

  ////////////////////////////////////////////////////////////////////////
  ////////////////// ABSTRACTED TABLE WITH ACTIVITY PUZZLE PIECES ////////
  ////////////////// (Shows if props.fullTableType isnt present) /////////
  ////////////////////////////////////////////////////////////////////////
  const abstractedColumns = [
    {
      title: <CustomHeaderTitle type="cohort">Timestamp</CustomHeaderTitle>,
      dataIndex: 'timestamp',
      key: 'key',
      width: TIMESTAMP_COLUMN_WIDTH,
    },
    {
      title: <CustomHeaderTitle type="cohort">Customer</CustomHeaderTitle>,
      dataIndex: 'customer',
      key: 'key',
      width: CUSTOMER_COLUMN_WIDTH,
      render: (text: string) => {
        return (
          <HighlightedCustomer highlighted={tableConfig.focusCustomer && text === customer}>{text}</HighlightedCustomer>
        )
      },
    },
    {
      title: <CustomHeaderTitle type="cohort">Primary Activity</CustomHeaderTitle>,
      dataIndex: 'cohort',
      key: 'key',
      render: (_text: string, _record: any, index: number) => {
        const columnConfig = tableConfig.cohort[index]
        return (
          <Flex>
            <ActivityPuzzlePiece
              name={cohortActivityName}
              ignored={columnConfig.ignored}
              highlighted={columnConfig.highlighted}
              type={columnConfig.type}
              value={columnConfig.value}
            />
          </Flex>
        )
      },
    },
    {
      title: <CustomHeaderTitle type="append">Join Activity</CustomHeaderTitle>,
      dataIndex: 'append',
      key: 'key',
      render: (_text: string, _record: unknown, index: number) => {
        const columnConfig = tableConfig.append[index]
        return (
          <Flex alignItems="center">
            {columnConfig.aggFunction && (
              <Box mr={1}>
                <FunctionOutlined />
              </Box>
            )}
            <ActivityPuzzlePiece
              name={appendActivityName}
              ignored={columnConfig.ignored}
              highlighted={columnConfig.highlighted}
              type={columnConfig.type}
              value={columnConfig.value}
            />
          </Flex>
        )
      },
    },
  ]

  return (
    // Get table size so we can calculate column widths
    // for cohort and activity feature columns
    <Measure
      bounds
      onResize={(contentRect) => {
        setTableWidth(contentRect?.bounds?.width || 0)
      }}
    >
      {({ measureRef }) => (
        <div ref={measureRef} style={{ width: '100%', position: 'relative' }}>
          <Table
            dataSource={tableRows}
            columns={fullTableType ? fullTableColumns : abstractedColumns}
            pagination={false}
            size="small"
          />
        </div>
      )}
    </Measure>
  )
}

export default RelationshipAnimationTable
