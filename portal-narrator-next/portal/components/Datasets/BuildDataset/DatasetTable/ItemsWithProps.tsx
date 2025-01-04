import { ColDef, ColGroupDef } from '@ag-grid-community/core'
import { Tooltip } from 'antd-next'
import { formatLocalTimeToUTC } from 'components/Activities/v2/helpers'
import { useCompany } from 'components/context/company/hooks'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { copyCsv, copyJson } from 'components/shared/DataTable/helpers'
import { RowData } from 'components/shared/DataTable/interfaces'
import { Item, Separator, Submenu } from 'components/shared/menus'
import { compact, find, isEmpty, map } from 'lodash'
import moment from 'moment-timezone'
import { useContext } from 'react'
import styled from 'styled-components'
import { colors } from 'util/constants'
import { COLUMN_TYPE_TIMESTAMP, getAllGroupColumns, OPERATOR_IS_NOT_NULL, OPERATOR_IS_NULL } from 'util/datasets'
import { makeShortid } from 'util/shortid'

export const GRID_CONTEXT_MENU_ID = 'dataset_table_grid_menu'

interface Props {
  selectCustomerJourney: Function
  propsFromTrigger?: {
    cellValue: string | null
    columnHeader: string
    columnId: string
    columnType: string
    rowData: RowData
    selectedRows: RowData[]
    columnDefs: ColDef | ColGroupDef
  }
}

const StyledSubmenu = styled(Submenu)`
  &:hover {
    background-color: ${colors.gray200};
  }
`

const StyledItem = styled(Item)`
  &:hover {
    background-color: ${colors.gray200};
  }
`

const ItemsWithProps = ({ selectCustomerJourney, propsFromTrigger }: Props) => {
  const company = useCompany()
  const { machineCurrent, machineSend } = useContext(DatasetFormContext)
  const { context: machineContext } = machineCurrent
  const {
    _has_customer_column: hasCustomerColumn,
    _group_slug: groupSlug,
    _row_shortcuts: rowShortcuts,
    all_groups: allGroups,
    columns,
  } = machineContext

  const cellValue = propsFromTrigger?.cellValue
  const columnHeader = propsFromTrigger?.columnHeader
  const columnId = propsFromTrigger?.columnId
  const columnType = propsFromTrigger?.columnType
  const rowData = propsFromTrigger?.rowData
  const selectedRows = propsFromTrigger?.selectedRows
  const columnDefs = propsFromTrigger?.columnDefs

  const isDuplicateParentGroup = !!find(allGroups, ['slug', groupSlug])?.is_parent

  // Used for Customer Journey options only
  const updatedRowData = {
    ...rowData,
    // add result_id to cause diff in CustomerDrawer
    // this allows you to open a row, close the drawer, and then re-open on the same row (otherwise it would never open)
    result_id: makeShortid(),
  }

  const isTimestamp = columnType === COLUMN_TYPE_TIMESTAMP

  const handleAddFilter = (isEqualOrGreater: boolean) => {
    let operator = isEqualOrGreater ? 'equal' : 'not_equal'
    let value = cellValue

    // timestamps use greater than or less than instead of =/!=
    if (isTimestamp) {
      operator = isEqualOrGreater ? 'greater_than' : 'less_than'
      // hi-jack time function from CompanyTimezoneDatePicker to match its formatting
      value = formatLocalTimeToUTC({
        value: moment(cellValue).toObject(),
        resolution: 'date_time',
        timezone: company.timezone,
      })
    }

    // use (not)_is_null for null cellValues
    if (cellValue === null) {
      operator = isEqualOrGreater ? OPERATOR_IS_NULL : OPERATOR_IS_NOT_NULL
    }

    // add or_null for non-timestamp + not_equal filter
    const orNull = operator === 'not_equal'

    const filter = {
      kind: 'value',
      operator,
      or_null: orNull,
      value,
    }

    machineSend('ADD_TABLE_CELL_FILTER', { column_id: columnId, filter, groupSlug })
  }

  const handleCopyJson = () => {
    copyJson({ rowData, selectedRows, columnDefs })
  }

  const handleCopyCsv = () => {
    copyCsv({ rowData, selectedRows, columnDefs })
  }

  return (
    <div>
      {/* Only show customer journey options for Parent Dataset or Duplicate Parent Groups */}
      {(!groupSlug || isDuplicateParentGroup) && (
        <>
          <Tooltip title={hasCustomerColumn ? '' : 'Add a customer column to see customer data'}>
            <div data-test="dataset-row-menu">
              <StyledItem
                id="customer-journey-activities-in-dataset"
                onClick={() => selectCustomerJourney(updatedRowData)}
                disabled={!hasCustomerColumn}
              >
                View Customer Journey (only activities in dataset)
              </StyledItem>
              <StyledItem
                id="customer-journey-all-activities"
                onClick={() => selectCustomerJourney(updatedRowData, { fullJourney: true })}
                disabled={!hasCustomerColumn}
              >
                View Customer Journey (all activities)
              </StyledItem>
            </div>
          </Tooltip>
          <Separator />
        </>
      )}

      {!isDuplicateParentGroup && (
        <>
          <StyledItem
            id="filter-column-header-is-cell-value"
            onClick={() => handleAddFilter(true)}
          >{`Filter for when ${columnHeader} is ${isTimestamp ? 'greater than ' : ''}${cellValue}`}</StyledItem>
          <StyledItem
            id="filter-column-header-is-not-cell-value"
            onClick={() => handleAddFilter(false)}
          >{`Filter for when ${columnHeader} is ${isTimestamp ? 'less than ' : 'not '} ${cellValue}`}</StyledItem>

          {compact(
            map(rowShortcuts, (shortcut) => {
              // some row shortcuts are only available to parent and some to groups
              const shouldShow = !!((shortcut.in_group && groupSlug) || (shortcut.in_parent && !groupSlug))
              if (!shouldShow) {
                return null
              }

              // select_columns can be "parent", "group", or undefined
              // if no select columns - don't add submenu of column options
              if (!shortcut.select_columns) {
                return (
                  <StyledItem
                    id={shortcut.key}
                    key={shortcut.key}
                    onClick={() => {
                      machineSend('APPLY_ROW_SHORTCUT', { row: updatedRowData, key: shortcut.key, columnId })
                    }}
                  >
                    {shortcut.label}
                  </StyledItem>
                )
              }

              // if select_columns - add submenu of columns options
              let subMenuColums
              if (shortcut.select_columns === 'parent') {
                subMenuColums = columns
              }

              if (shortcut.select_columns === 'group') {
                const group = find(allGroups, ['slug', groupSlug])
                subMenuColums = getAllGroupColumns({ groupQuery: group })
              }

              if (!isEmpty(subMenuColums)) {
                return (
                  <StyledSubmenu label={shortcut.label} style={{ backgroundColor: 'white' }}>
                    {map(subMenuColums, (col) => (
                      <StyledItem
                        id={col.id}
                        key={col.id}
                        onClick={() =>
                          machineSend('APPLY_ROW_SHORTCUT', {
                            row: updatedRowData,
                            key: shortcut.key,
                            columnId,
                            shortcutColumnId: col.id,
                          })
                        }
                      >
                        {col.label}
                      </StyledItem>
                    ))}
                  </StyledSubmenu>
                )
              }

              // this shouldn't happen, but just in case
              return null
            })
          )}
        </>
      )}

      {/* Copy JSON/CSV */}
      <Separator />
      <StyledItem id="copy-json" onClick={handleCopyJson}>
        Copy JSON
      </StyledItem>
      <StyledItem id="copy-csv" onClick={handleCopyCsv}>
        Copy CSV
      </StyledItem>
    </div>
  )
}

export default ItemsWithProps
