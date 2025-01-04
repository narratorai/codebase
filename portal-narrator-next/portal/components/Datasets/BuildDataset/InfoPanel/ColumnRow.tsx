import {
  CaretDownOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  FilterFilled,
  FilterOutlined,
  InsertRowLeftOutlined,
  InsertRowRightOutlined,
  SettingOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import { Checkbox, Dropdown, Space, Tooltip } from 'antd-next'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { Box, Flex } from 'components/shared/jawns'
import { compact, filter, find, get, includes, isEmpty, map } from 'lodash'
import { makeQueryDefinitionFromContext } from 'machines/datasets'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import styled from 'styled-components'
import { colors } from 'util/constants'
import {
  AGGREGATE_ACTIVITY_RELATIONSHIPS,
  COLUMN_KIND_COMPUTED,
  COLUMN_KIND_GROUP_BY,
  COLUMN_KIND_GROUP_METRIC,
  COLUMN_TYPE_NUMBER,
  COLUMN_TYPE_STRING,
  getGroupFromContext,
  NUMBER_COLUMN_TYPES,
  RAW_DATASET_KEY,
  STRING_COLUMN_TYPES,
  TOOL_ORDER_BY,
} from 'util/datasets'
import {
  DatasetColumnType,
  IDatasetQuery,
  IDatasetQueryColumn,
  IDatasetQueryGroup,
  IDatasetQueryGroupColumn,
} from 'util/datasets/interfaces'

import EditLabelField from './EditLabelField'
import MenuItemTooltip from './MenuItemTooltip'

const ACTIVITY_TIMESTAMP_COLUMN_NAME = 'ts'
const ACTIVITY_TIMESTAMP_TOOLTIP = 'The activity timestamp column is required. Try "Hide Column" instead.'

const ColumnRowWrapper = styled(({ hidden, ...props }) => <Flex {...props} />)`
  width: 100%;
  opacity: ${({ hidden }) => (hidden ? 0.5 : 1)};
  text-decoration: ${({ hidden }) => (hidden ? 'line-through' : 'initial')};

  svg {
    display: block;
  }
`
const ColumnLabelWrapper = styled(({ selected, asHeader, kpiLocked, ...props }) => <Flex {...props} />)`
  width: 100%;
  min-width: 0;
  margin-right: ${({ asHeader }) => (asHeader ? '0px' : '16px')};
  align-items: center;
  cursor: ${({ kpiLocked }) => (kpiLocked ? 'default' : 'pointer')};

  /* When column is selected make sure to maintain the hover styles: */
  svg {
    display: ${({ selected }) => (selected ? 'block' : 'none')};
  }

  p {
    color: ${({ selected, theme }) => (selected ? theme.colors.blue500 : 'inherit')};
  }

  &:hover {
    svg {
      display: block;
    }

    p {
      color: ${(props) => props.theme.colors.blue500};
    }
  }
`

const DisabledFilters = styled.div`
  &:hover {
    cursor: not-allowed;
  }
`

const getOrderConfig = ({
  groupSlug,
  columnDefinition,
  query,
  groupQuery,
}: {
  groupSlug?: string | null
  columnDefinition: DatasetColumnType
  query?: IDatasetQuery
  groupQuery?: IDatasetQueryGroup
}) => {
  if (groupSlug) {
    return find(groupQuery?.order, { column_id: columnDefinition.id })
  }

  return find(query?.order, { column_id: columnDefinition.id })
}

interface Props {
  columnDefinition: DatasetColumnType
  columnKind?: string | null
  relationshipSlug?: string
  asHeader?: boolean
}

const ColumnRow = ({ columnDefinition, columnKind = null, relationshipSlug, asHeader = false }: Props) => {
  const [renamingColumn, setRenamingColumn] = useState(false)
  const [columnSelected, setColumnSelected] = useState(false)
  const { groupSlug, machineCurrent, machineSend, onOpenToolOverlay } = useContext(DatasetFormContext)

  const { kpi } = machineCurrent.context
  const kpiLocked = (columnDefinition as IDatasetQueryGroupColumn).kpi_locked

  const deleteColumnsTabs = machineCurrent.context._delete_columns_tabs
  const deleteColumnsTabName = groupSlug ? groupSlug : RAW_DATASET_KEY
  const deleteColumnsTab = find(deleteColumnsTabs, ['tabName', deleteColumnsTabName])
  const deleteChecked = includes(
    map(deleteColumnsTab?.deleteColumnsIds, (id) => id),
    columnDefinition?.id
  )

  const query = makeQueryDefinitionFromContext(machineCurrent.context).query
  const groupQuery = getGroupFromContext({ context: machineCurrent.context, groupSlug })

  const { _column_shortcuts: columnShortcuts } = machineCurrent.context

  const onOpenFilters = useCallback(() => {
    machineSend('EDIT_FILTER_COLUMN', { column: columnDefinition, groupSlug })
  }, [machineSend, groupSlug, columnDefinition])

  const onLabelChange = useCallback(
    (value: string) => {
      machineSend('EDIT_COLUMN_LABEL', { groupSlug, label: value, columnId: columnDefinition.id })
    },
    [machineSend, groupSlug, columnDefinition]
  )

  const handleRenameBlur = useCallback(
    (value: string) => {
      onLabelChange(value)
      setRenamingColumn(false)
    },
    [onLabelChange]
  )

  const isGroupColumn = !!groupSlug
  const isDuplicateParentGroup = machineCurrent.context._is_parent_duplicate

  const columnOrderConfig = getOrderConfig({ groupSlug, columnDefinition, query, groupQuery })
  const SortIconComponent =
    columnOrderConfig?.order_direction === 'desc' ? SortAscendingOutlined : SortDescendingOutlined

  // Don't allow users to delete activity timestamps
  // unless they're from an aggregate relationship:
  // aggregate in between, aggregate all ever, etc...
  const isActivityTimestampColumn = get(columnDefinition, 'name') === ACTIVITY_TIMESTAMP_COLUMN_NAME
  const isAggRelationship = includes(AGGREGATE_ACTIVITY_RELATIONSHIPS, relationshipSlug)
  const cannotDelete = (!isGroupColumn && isActivityTimestampColumn && !isAggRelationship) || kpiLocked

  // Only select possible column shortcuts based on column type
  // and whether it's a parent column or a group column
  const typeSpecificColumnShortcuts = filter(columnShortcuts, (shortcut) => {
    // MAVIS only sends back "number" in column_types
    // make sure "integer", "float", etc... get cast as "number"
    const typeOverride = includes(NUMBER_COLUMN_TYPES, columnDefinition.type)
      ? COLUMN_TYPE_NUMBER
      : includes(STRING_COLUMN_TYPES, columnDefinition.type)
        ? COLUMN_TYPE_STRING
        : columnDefinition.type
    return includes(shortcut.column_types, typeOverride) && (isGroupColumn ? shortcut.in_group : shortcut.in_parent)
  })

  const columnPivoted = (columnDefinition as IDatasetQueryGroupColumn).pivoted

  const isAppendComputedColumn =
    (columnDefinition as IDatasetQueryColumn).source_kind === 'computed' &&
    (columnDefinition as IDatasetQueryColumn).source_details?.activity_kind === 'append'

  const menuItems = compact([
    {
      key: 'rename_column',
      disabled: kpiLocked,
      onClick: () => setRenamingColumn(true),
      icon: <EditOutlined data-test="rename-column-option" />,
      label: kpiLocked ? (
        <MenuItemTooltip
          tooltipTitle={`This is part of the ${kpi?.name} definition and cannot be edited`}
          menuItemLabel="Rename"
        />
      ) : (
        'Rename'
      ),
    },

    {
      key: 'toggle_visibility',
      disabled: kpiLocked,
      onClick: () => {
        machineSend('TOGGLE_COLUMN_VISIBILITY', { columnId: columnDefinition.id, groupSlug })
      },
      icon: columnDefinition?.output ? (
        <EyeInvisibleOutlined data-test="hide-column-option" />
      ) : (
        <EyeOutlined data-test="hide-column-option" />
      ),
      label: kpiLocked ? (
        <MenuItemTooltip
          tooltipTitle={`This is part of the ${kpi?.name} definition and cannot be edited`}
          menuItemLabel={columnDefinition?.output ? 'Hide Column' : 'Show Column'}
        />
      ) : columnDefinition?.output ? (
        'Hide Column'
      ) : (
        'Show Column'
      ),
    },

    columnKind === COLUMN_KIND_GROUP_BY
      ? {
          key: 'swap_column_id',
          disabled: kpiLocked,
          onClick: () => {
            machineSend('EDIT_SWAP_GROUP_COLUMN', { column: columnDefinition, groupSlug })
          },
          icon: <SwapOutlined />,
          label: kpiLocked ? (
            <MenuItemTooltip
              tooltipTitle={`This is part of the ${kpi?.name} definition and cannot be edited`}
              menuItemLabel="Swap Column"
            />
          ) : (
            'Swap Column'
          ),
        }
      : null,

    columnKind === COLUMN_KIND_COMPUTED || isAppendComputedColumn
      ? {
          key: 'edit_computation_column',
          disabled: kpiLocked,
          onClick: () => {
            machineSend('EDIT_COMPUTATION', { column: columnDefinition })
          },
          icon: <SettingOutlined data-test="edit-column-option" />,
          label: kpiLocked ? (
            <MenuItemTooltip
              tooltipTitle={`This is part of the ${kpi?.name} definition and cannot be edited`}
              menuItemLabel="Edit"
            />
          ) : (
            'Edit'
          ),
        }
      : null,

    columnKind === COLUMN_KIND_COMPUTED || columnKind === COLUMN_KIND_GROUP_METRIC
      ? {
          key: 'duplicate_column',
          onClick: () => {
            machineSend('DUPLICATE_COLUMN', { columnId: columnDefinition.id, groupSlug })
          },
          icon: <CopyOutlined />,
          label: 'Duplicate',
        }
      : null,

    columnKind === COLUMN_KIND_GROUP_METRIC
      ? {
          key: 'edit_metric_column',
          disabled: kpiLocked,
          onClick: () => {
            machineSend('EDIT_METRIC_COLUMN', { column: columnDefinition })
          },
          icon: <SettingOutlined />,
          label: kpiLocked ? (
            <MenuItemTooltip
              tooltipTitle={`This is part of the ${kpi?.name} definition and cannot be edited`}
              menuItemLabel="Edit"
            />
          ) : (
            'Edit'
          ),
        }
      : null,

    !isDuplicateParentGroup
      ? {
          key: 'sort_column',
          onClick: () => {
            onOpenToolOverlay({
              toolType: TOOL_ORDER_BY,
            })
          },
          icon: <SortAscendingOutlined />,
          label: <span data-test="order-column-option">Order</span>,
        }
      : null,

    columnKind === COLUMN_KIND_GROUP_BY
      ? {
          key: 'pivot_column',
          disabled: kpiLocked,
          onClick: () => {
            columnPivoted
              ? machineSend('EDIT_REVERSE_COLUMN_PIVOT', { column: columnDefinition })
              : machineSend('EDIT_COLUMN_PIVOT', { column: columnDefinition })
          },
          icon: columnPivoted ? <InsertRowLeftOutlined /> : <InsertRowRightOutlined />,
          label: kpiLocked ? (
            <Tooltip placement="right" title={`This is part of the ${kpi?.name} definition and cannot be edited`}>
              <div style={{ display: 'inline-block', minWidth: 188 }}>Pivot</div>
            </Tooltip>
          ) : columnPivoted ? (
            'Reverse Pivot'
          ) : (
            'Pivot'
          ),
        }
      : null,

    !isDuplicateParentGroup
      ? {
          key: 'delete_column',
          disabled: cannotDelete,
          onClick: () => {
            machineSend('DELETE_COLUMN', { column: columnDefinition, groupSlug })
          },
          icon: <DeleteOutlined data-test="delete-column-option" />,
          // Don't allow users to delete activity timestamps!
          label: cannotDelete ? (
            <MenuItemTooltip
              tooltipTitle={
                kpiLocked
                  ? `This is part of the ${kpi?.name} definition and cannot be edited`
                  : ACTIVITY_TIMESTAMP_TOOLTIP
              }
              menuItemLabel="Delete"
            />
          ) : (
            'Delete'
          ),
        }
      : null,

    typeSpecificColumnShortcuts.length > 0 ? { type: 'divider' } : null,

    ...typeSpecificColumnShortcuts.map((shortcut) => {
      if (shortcut.options.length > 0) {
        return {
          key: shortcut.key,
          label: <span data-test="column-multi-option-menu">{shortcut.label}</span>,
          children: shortcut.options.map((option) => ({
            key: `${shortcut.key}.${option.key}`,
            label: <span data-test="column-sub-option">{option.label}</span>,
            onClick: () => {
              machineSend('APPLY_COLUMN_SHORTCUT', {
                column: columnDefinition,
                key: shortcut.key,
                option: option.key,
              })
            },
          })),
        }
      }

      return {
        key: shortcut.key,
        onClick: () => machineSend('APPLY_COLUMN_SHORTCUT', { column: columnDefinition, key: shortcut.key }),
        label: <span data-test="column-option">{shortcut.label}</span>,
      }
    }),
  ])

  // ensure menu is closed if renaming
  useEffect(() => {
    if (renamingColumn && columnSelected) {
      setColumnSelected(false)
    }
  }, [renamingColumn, columnSelected])

  return (
    <ColumnRowWrapper
      data-test="column-row"
      justifyContent="space-between"
      alignItems="center"
      hidden={!columnDefinition?.output || columnPivoted}
    >
      {/* no dropdown/rename for _is_parent group */}
      <Dropdown
        data-public
        disabled={renamingColumn || isDuplicateParentGroup}
        menu={{
          // @ts-ignore: not accepting divider (thinks it's a submenu item)
          items: menuItems,
          onClick: () => setColumnSelected(false),
          'data-test': 'column-menu',
        }}
        trigger={['click']}
        onOpenChange={(visible) => {
          if (visible) {
            return setColumnSelected(true)
          }
          // Clear out columnSelected if the Dropdown is closed:
          setColumnSelected(false)
        }}
        open={columnSelected}
      >
        <div style={{ flex: 1 }}>
          <ColumnLabelWrapper
            asHeader={asHeader}
            selected={columnSelected}
            onClick={(e: React.MouseEvent<HTMLElement>) => {
              // Prevent default to allow double click to work
              e.preventDefault()
            }}
            onDoubleClick={() => {
              setRenamingColumn(true)
              setColumnSelected(false)
            }}
          >
            <Box flexGrow={1}>
              <EditLabelField
                renaming={!isDuplicateParentGroup && renamingColumn}
                toggleRenaming={() => {
                  if (!isDuplicateParentGroup) {
                    setRenamingColumn(!renamingColumn)
                    setColumnSelected(false)
                  }
                }}
                value={columnDefinition.label}
                onChange={onLabelChange}
                onBlur={handleRenameBlur}
                withCloseIcon={false}
              />
            </Box>
            {!renamingColumn && !isDuplicateParentGroup && (
              <Box pl="4px">
                <CaretDownOutlined style={{ color: colors.gray500 }} />
              </Box>
            )}
          </ColumnLabelWrapper>
        </div>
      </Dropdown>

      <Space size={4} className="row-actions">
        {deleteColumnsTab ? (
          <>
            {/* Don't allow users to delete activity timestamps! */}
            {cannotDelete ? (
              <Tooltip placement="right" title={ACTIVITY_TIMESTAMP_TOOLTIP}>
                <Checkbox disabled data-test="delete-column-checkbox-disabled" />
              </Tooltip>
            ) : (
              <Checkbox
                checked={deleteChecked}
                data-test="delete-column-checkbox"
                onChange={() =>
                  machineSend('TOGGLE_SELECT_COLUMN_FOR_DELETE', {
                    tabName: deleteColumnsTabName,
                    columnId: columnDefinition.id,
                  })
                }
              />
            )}
          </>
        ) : (
          !isDuplicateParentGroup && (
            <>
              {columnOrderConfig ? (
                <SortIconComponent
                  data-test="order-by-column-icon"
                  style={{ color: colors.blue500 }}
                  onClick={() => {
                    onOpenToolOverlay({
                      toolType: TOOL_ORDER_BY,
                    })
                  }}
                />
              ) : columnPivoted ? (
                // If column is pivoted it can't be ordered, so have it
                // take up the order icon area
                <Tooltip placement="top" title="Column Pivoted">
                  <InsertRowRightOutlined
                    style={{
                      color: colors.gray500,
                    }}
                  />
                </Tooltip>
              ) : (
                <div style={{ width: 14 }} />
              )}

              <div data-test="column-row-filter">
                {kpiLocked ? (
                  <Tooltip title={`This is part of the ${kpi?.name} definition and cannot be edited`}>
                    <DisabledFilters>
                      {isEmpty(columnDefinition.filters) ? (
                        <FilterOutlined style={{ color: colors.gray500 }} />
                      ) : (
                        <FilterFilled style={{ color: colors.blue500 }} />
                      )}
                    </DisabledFilters>
                  </Tooltip>
                ) : isEmpty(columnDefinition.filters) ? (
                  <FilterOutlined style={{ color: colors.gray500 }} onClick={onOpenFilters} />
                ) : (
                  <FilterFilled style={{ color: colors.blue500 }} onClick={onOpenFilters} />
                )}
              </div>
            </>
          )
        )}
      </Space>
    </ColumnRowWrapper>
  )
}

export default ColumnRow
