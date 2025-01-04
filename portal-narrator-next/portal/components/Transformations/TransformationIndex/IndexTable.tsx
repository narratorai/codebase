import { CodeOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { InputRef } from 'antd/lib/input'
import { App, Button, Input, Popover, Space, Table } from 'antd-next'
import { ColumnsType } from 'antd-next/es/table'
import MaintenanceIcon from 'components/Activities/MaintenanceIcon'
import { Divider, tableFilterSearch } from 'components/antd/staged'
import { useUser } from 'components/context/user/hooks'
import { Box, Flex, Link, Typography } from 'components/shared/jawns'
import { useLayoutContext } from 'components/shared/layout/LayoutProvider'
import { TRANSFORMATION_KIND_LOOKUP } from 'components/Transformations/constants'
import NextResyncIcon from 'components/Transformations/NextResyncIcon'
import { IMaintenance_Kinds_Enum, ITransformation_Maintenance } from 'graph/generated'
import {
  compact,
  each,
  includes,
  isEmpty,
  isEqual,
  isNull,
  keys,
  map,
  snakeCase,
  some,
  sortBy,
  startCase,
  trim,
  truncate,
  uniqBy,
} from 'lodash'
import moment from 'moment-timezone'
import pluralize from 'pluralize'
import queryString from 'query-string'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import { colors, semiBoldWeight, SIDENAV_WIDTH, SIDENAV_WIDTH_COLLAPSED } from 'util/constants'
import { getBadgeColor, percentify, timeFromNow, withinDayAgo, withinMonthAgo, withinWeekAgo } from 'util/helpers'
import usePrevious from 'util/usePrevious'

import { TransformationFromQuery, TransformationsFromQuery } from './interfaces'
import ProcessingItem from './ProcessingItem'
import StatusBadge from './StatusBadge'

export const TRANSFORMATION_ACTIVITY_NAME_QUERY_PARAM_KEY = 'activity_name'

type Column = ColumnsType<any>[number]

const HIDE_COLUMN_BREAKPOINTS = [1230, 1110, 970, 880]
const SIDENAV_WIDTH_DIFFERENCE = SIDENAV_WIDTH - SIDENAV_WIDTH_COLLAPSED

const StyledTable = styled(Table)<{ collapsed: boolean }>`
  ${({ collapsed }) => `
    @media only screen and (max-width: ${
      collapsed ? HIDE_COLUMN_BREAKPOINTS[0] - SIDENAV_WIDTH_DIFFERENCE : HIDE_COLUMN_BREAKPOINTS[0]
    }px) {
      .transformation-column-activities {
        display: none;
      }
    }

    @media only screen and (max-width: ${
      collapsed ? HIDE_COLUMN_BREAKPOINTS[1] - SIDENAV_WIDTH_DIFFERENCE : HIDE_COLUMN_BREAKPOINTS[1]
    }px) {
      .transformation-column-processing-config {
        display: none;
      }
    }

    @media only screen and (max-width: ${
      collapsed ? HIDE_COLUMN_BREAKPOINTS[2] - SIDENAV_WIDTH_DIFFERENCE : HIDE_COLUMN_BREAKPOINTS[2]
    }px) {
      .transformation-column-actions {
        display: none;
      }
    }

    @media only screen and (max-width: ${
      collapsed ? HIDE_COLUMN_BREAKPOINTS[3] - SIDENAV_WIDTH_DIFFERENCE : HIDE_COLUMN_BREAKPOINTS[3]
    }px) {
      .transformation-column-update-type {
        display: none;
      }
    }
`}
`

const NameContainer = styled(Box)`
  a,
  div {
    color: black;

    &:hover {
      text-decoration: none;
      color: ${colors.blue500};
    }
  }
`

const HoverBox = styled(Box)`
  &:hover {
    cursor: pointer;
    color: ${colors.blue500};
  }
`

const ActivityLink = styled(Link)`
  color: ${colors.gray500};
  text-decoration: underline;

  &:hover {
    color: ${colors.gray600};
  }
`

const DEFAULT_FILTERS = {
  name: null,
  kind: null,
  activities: null,
  updateType: null,
  lastPublished: null,
  processingConfiguration: null,
}

const processingConfigOptions = (transformation: TransformationFromQuery) =>
  compact([
    transformation?.allow_future_data === true && { text: 'Allow Future Data' },
    !isNull(transformation?.delete_window) && {
      text: 'Delete Window',
      hoverContent: pluralize('day', transformation.delete_window, true),
    },
    !isEmpty(transformation?.depends_on_transformations) && {
      text: 'Depends on Transformations',
      hoverContent: (
        <Box>
          {map(transformation.depends_on_transformations, (depTrans) => (
            <Typography key={depTrans.id}>{depTrans?.depends_on_transformations?.name}</Typography>
          ))}
        </Box>
      ),
    },
    transformation?.do_not_delete_on_resync === true && { text: 'Do Not Delete on Resync' },
    transformation?.has_source === true && { text: 'Requires Identity Resolution' },
    transformation?.is_aliasing === true && { text: 'Is Aliasing' },
    !isNull(transformation?.max_days_to_insert) && {
      text: 'Max Days to Insert',
      hoverContent: pluralize('day', transformation?.max_days_to_insert, true),
    },
    !isNull(transformation?.notify_row_count_percent_change) && {
      text: 'Notify Row Count Percent Change',
      hoverContent: percentify(transformation.notify_row_count_percent_change),
    },
    transformation?.remove_customers === true && { text: 'Remove Customers' },
    !isEmpty(transformation?.run_after_transformations) && {
      text: 'Run After Transformations',
      hoverContent: (
        <Box>
          {map(transformation.run_after_transformations, (runTrans) => (
            <Typography key={runTrans.id}>{runTrans?.run_after_transformations?.name}</Typography>
          ))}
        </Box>
      ),
    },
    !isNull(transformation?.start_data_after) && {
      text: 'Start Data After',
      hoverContent: transformation?.start_data_after,
    },
    !isEmpty(transformation?.validation_queries?.[0]?.alert) && {
      text: 'Has Alert',
      hoverContent: (
        <Box>
          {compact(
            map(transformation?.validation_queries, (valQuery) => {
              if (valQuery?.alert?.company_task?.task_slug) {
                return <Typography key={valQuery.id}>{startCase(valQuery?.alert?.company_task?.task_slug)}</Typography>
              }

              return undefined
            })
          )}
        </Box>
      ),
    },
  ])

const makeTableData = ({
  transformations,
  setTransformationItem,
  setDeleteTransformation,
  isCompanyAdmin,
}: {
  transformations?: TransformationsFromQuery
  setTransformationItem: (item: TransformationFromQuery | undefined) => void
  setDeleteTransformation: (item: TransformationFromQuery | undefined) => void
  isCompanyAdmin: boolean
}) => {
  return map(transformations, (transformation) => ({
    key: transformation.id,
    name: transformation,
    kind: transformation,
    activities: transformation,
    updateType: transformation,
    lastPublished: transformation,
    processingConfiguration: transformation,
    actions: { transformation, setTransformationItem, setDeleteTransformation, isCompanyAdmin },
  }))
}

const makeColumnsConfig = ({
  filters = DEFAULT_FILTERS,
  allTables,
  allActivities,
  allTranformationUpdaters,
  allUpdateTypes,
  searchInputRef,
}: {
  filters?: Record<string, string[] | null>
  allTables: { kind: string; table: string }[]
  allActivities: string[]
  allTranformationUpdaters: string[]
  allUpdateTypes: string[]
  searchInputRef: React.RefObject<InputRef>
}) => {
  // antd wants filteredValue passed to all columns if any have a filter
  const hasAnyFilters = some(filters, (val) => !!val)
  const defaultFilteredValue = hasAnyFilters ? [] : null

  const name: Column = {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    filteredValue: filters['name'] || defaultFilteredValue,
    filterMode: 'tree',
    filters: [
      {
        text: 'Last Rows Inserted',
        value: 'rows_inserted',
        children: [
          { text: 'Live: < 7 days', value: 'success' },
          { text: 'Delayed: 7 - 30 days', value: 'warning' },
          { text: 'Warning: > 30 days', value: 'error' },
          { text: 'Never Updated', value: 'never_updated' },
        ],
      },
      {
        text: 'Maintenance',
        value: 'all_maintenances',
        children: [
          { text: 'Maintenance Updating', value: 'maintenance_updating' },
          { text: 'Maintenance has Error', value: 'maintenance_has_error' },
        ],
      },
    ],
    onFilter: (value, record) => {
      // if no status have been filtered for, show all
      if (isEmpty(value)) {
        return true
      }

      // check for maintenance
      const lastMaintenanceKind = record.name.transformation_maintenances?.[0]?.kind
      const isResync =
        lastMaintenanceKind === IMaintenance_Kinds_Enum.Resynced ||
        lastMaintenanceKind === IMaintenance_Kinds_Enum.CascadeResynced

      // check if maintenance is updating
      if (value === 'maintenance_updating' && isResync) {
        return true
      }

      // otherwise check if maintence has error
      // (if it is under maintenance and not resyncing)
      if (value === 'maintenance_has_error' && !!lastMaintenanceKind && !isResync) {
        return true
      }

      // otherwise check for status
      const lastQueryUpdate = record.name.query_updates?.[0]
      const badgeStatus = isEmpty(lastQueryUpdate) ? 'never_updated' : getBadgeColor(lastQueryUpdate.processed_at)

      return value === badgeStatus
    },
    sorter: (a: any, b: any) => a?.name?.name?.localeCompare(b?.name?.name),
    render: (transformation: TransformationFromQuery) => {
      const isUnderMaintenance = !isEmpty(transformation.transformation_maintenances)
      const nextResync = transformation.next_resync_at

      const hasResyncOrMaintenance = isUnderMaintenance || nextResync

      return (
        transformation?.name && (
          <Flex alignItems="center">
            <Box mr={2}>
              {hasResyncOrMaintenance && (
                <Flex alignItems="center">
                  {isUnderMaintenance && (
                    <Box mr={1}>
                      <MaintenanceIcon
                        withSpin
                        maintenance={transformation.transformation_maintenances[0] as ITransformation_Maintenance}
                      />
                    </Box>
                  )}

                  {nextResync && <NextResyncIcon nextResync={nextResync} />}
                </Flex>
              )}

              {!isUnderMaintenance && <StatusBadge transformation={transformation} />}
            </Box>
            <NameContainer data-test="transformation-name">
              <Link to={`/transformations/edit/${transformation.id}`}>{startCase(transformation.name)}</Link>
            </NameContainer>
          </Flex>
        )
      )
    },
  }

  const kind: Column = {
    title: 'Kind',
    dataIndex: 'kind',
    key: 'kind',
    className: 'transformation-column-kind',
    filteredValue: filters['kind'] || defaultFilteredValue,
    filterMode: 'tree',
    filters: [
      {
        text: 'Kind',
        value: 'all_kinds',
        children: map(keys(TRANSFORMATION_KIND_LOOKUP), (value) => ({
          text: TRANSFORMATION_KIND_LOOKUP[value],
          value,
        })),
      },
      {
        text: 'Table',
        value: 'all_tables',
        children: map(allTables, (table) => ({ text: table.table, value: table.table })),
      },
    ],
    onFilter: (value, record) => {
      // if no kind or table have been filtered for, show all
      if (isEmpty(value)) {
        return true
      }

      // check if there is a match on kind
      if (record.kind.kind === value) {
        return true
      }

      // check if there is a match on table
      if (record.kind.table === value) {
        return true
      }

      // otherwise niether kind nor table matched
      return false
    },
    render: (transformation: TransformationFromQuery) => {
      return (
        <Box>
          {transformation?.kind && TRANSFORMATION_KIND_LOOKUP[transformation.kind] && (
            <Typography>{TRANSFORMATION_KIND_LOOKUP[transformation.kind]}</Typography>
          )}
          {transformation?.table && <Typography color={colors.gray500}>{transformation.table}</Typography>}
        </Box>
      )
    },
  }

  const activities: Column = {
    title: 'Activities',
    dataIndex: 'activities',
    key: 'activities',
    className: 'transformation-column-activities',
    filteredValue: filters['activities'] || defaultFilteredValue,
    filters: map(allActivities, (act) => ({ text: act, value: act })),
    onFilter: (value, record) => {
      // if no activities have been filtered for, show all
      if (isEmpty(value)) {
        return true
      }

      // if there was an activity filter, but transformation has no activities
      // don't show it
      if (isEmpty(record.activities)) {
        return false
      }

      // otherwise, see if the record contains that activity
      return some(record.activities?.activities, (activity) => trim(activity?.activity?.name) === value)
    },
    filterSearch: (input, record) => tableFilterSearch(input, record),
    render: (transformation: TransformationFromQuery) => {
      return (
        <Flex flexWrap="wrap" style={{ maxWidth: '240px' }}>
          {compact(
            map(transformation?.activities, (act, index) => {
              // only show the first 3 activities by defualt
              if (index < 3) {
                return transformation?.activities?.length - 1 === index || index === 2 ? (
                  <ActivityLink to={`/activities/edit/${act.activity.id}`} key={act.activity.id} mr={1}>
                    {act.activity.name}
                  </ActivityLink>
                ) : (
                  <ActivityLink
                    to={`/activities/edit/${act.activity.id}`}
                    key={act.activity.id}
                    mr={1}
                  >{`${act.activity.name}, `}</ActivityLink>
                )
              }

              // show more option if third
              if (index === 3) {
                return (
                  <Popover
                    key={'more_than_3_option'}
                    title="Activities"
                    getPopupContainer={(trigger: HTMLElement) => trigger.parentNode as HTMLElement}
                    content={
                      <Box>
                        {map(transformation?.activities, (act) => (
                          <Box key={act.id}>
                            <ActivityLink
                              to={`/activities/edit/${act.activity.id}`}
                              key={act.activity.id}
                              style={{ whiteSpace: 'nowrap' }}
                            >
                              {act.activity.name}
                            </ActivityLink>
                          </Box>
                        ))}
                      </Box>
                    }
                  >
                    <HoverBox>{` (+ ${transformation?.activities.length - 3} more)`}</HoverBox>
                  </Popover>
                )
              }

              // don't show activities after the 3rd
              return null
            })
          )}
        </Flex>
      )
    },
  }

  const updateType: Column = {
    title: 'Update Type',
    dataIndex: 'updateType',
    key: 'updateType',
    className: 'transformation-column-update-type',
    filteredValue: filters['updateType'] || defaultFilteredValue,
    filters: map(allUpdateTypes, (type) => ({ text: startCase(type), value: type })),
    onFilter: (value, record) => {
      // if no update types have been filtered for, show all
      if (isEmpty(value)) {
        return true
      }

      // check if filter matches the update type
      return value === record.updateType.update_type
    },
    render: (transformation: TransformationFromQuery) => {
      return transformation?.update_type && <Typography>{startCase(transformation.update_type)}</Typography>
    },
  }

  const lastPublished: Column = {
    title: 'Last Published',
    dataIndex: 'lastPublished',
    key: 'lastPublished',
    filteredValue: filters['lastPublished'] || defaultFilteredValue,
    filterMode: 'tree',
    filters: [
      {
        text: 'Last Published',
        value: 'all_last_published',
        children: [
          { text: 'Within a Day', value: 'within_day' },
          { text: 'Within 7 Days', value: 'within_week' },
          { text: 'Within a Month', value: 'within_month' },
          { text: 'Unpublished', value: 'unpublished' },
        ],
      },
      {
        text: 'Published By',
        value: 'all_published_by',
        children: map(allTranformationUpdaters, (updater) => ({ text: updater, value: updater })),
      },
    ],
    onFilter: (value, record) => {
      // if no user or time has been filtered for, show all
      if (isEmpty(value)) {
        return true
      }

      // check if filtered by user
      const lastUpdatedBy = record.lastPublished?.production_queries?.[0]?.updated_by
      if (lastUpdatedBy === value) {
        return true
      }

      // check if within a time filter
      const lastCreatedAt = record.lastPublished?.production_queries?.[0]?.created_at
      // check if there is a filter for unpublished
      if (value === 'unpublished' && !lastCreatedAt) {
        return true
      }

      // check if unpublished, but not filtered for unpublished
      if (!lastCreatedAt) {
        return false
      }

      // check for within month
      if (value === 'within_month' && withinMonthAgo(lastCreatedAt)) {
        return true
      }

      // check for within week
      if (value === 'within_week' && withinWeekAgo(lastCreatedAt)) {
        return true
      }

      // check for within day
      if (value === 'within_day' && withinDayAgo(lastCreatedAt)) {
        return true
      }

      // otherwise no filters matched
      return false
    },
    sorter: (a: any, b: any) => {
      // moment's unix doesn't handle null/undefined very well (returns NaN)
      // force null/undefined values to be 1 for sorting
      const aUnix = moment.utc(a?.lastPublished?.production_queries?.[0]?.created_at || 1).unix()
      const bUnix = moment.utc(b?.lastPublished?.production_queries?.[0]?.created_at || 1).unix()

      return aUnix - bUnix
    },
    render: (transformation: TransformationFromQuery) => {
      const updatedBy = transformation?.production_queries?.[0]?.updated_by

      return (
        <Box>
          <Typography title={updatedBy && updatedBy?.length > 24 ? updatedBy : undefined}>
            {updatedBy && truncate(updatedBy, { length: 24 })}
          </Typography>
          <Typography color={colors.gray500}>
            {transformation?.production_queries?.[0]?.created_at
              ? timeFromNow(transformation?.production_queries?.[0]?.created_at)
              : 'Unpublished'}
          </Typography>
        </Box>
      )
    },
  }

  const NON_ALERT_PROCESSING_FIELDS = [
    'allow_future_data',
    'delete_window',
    'depends_on_transformations',
    'do_not_delete_on_resync',
    'has_source',
    'is_aliasing',
    'max_days_to_insert',
    'notify_row_count_percent_change',
    'remove_customers',
    'run_after_transformations',
    'start_data_after',
  ]

  const processingConfiguration: Column = {
    title: 'Processing Configuration',
    dataIndex: 'processingConfiguration',
    key: 'processingConfiguration',
    className: 'transformation-column-processing-config',
    filteredValue: filters['processingConfiguration'] || defaultFilteredValue,
    filters: [
      ...map(NON_ALERT_PROCESSING_FIELDS, (field) => ({
        text: field === 'has_source' ? 'Requires Identity Resolution' : startCase(field),
        value: field,
      })),
      { text: 'Has Alert', value: 'has_alert' },
    ],
    onFilter: (value, record) => {
      // if no user or time has been filtered for, show all
      if (isEmpty(value)) {
        return true
      }

      const val = value.toString()
      const transformation = record.processingConfiguration

      // check each non alert field
      if (
        value !== 'has_alert' &&
        transformation[val] &&
        (!isEmpty(transformation[val]) || isFinite(transformation[val]) || transformation[val] === true)
      ) {
        return true
      }

      // check for alerts
      if (val === 'has_alert' && !isEmpty(transformation?.validation_queries?.[0]?.alert)) {
        return true
      }

      // otherwise there is no match
      return false
    },
    filterSearch: (input, record) => tableFilterSearch(input, record),
    render: (transformation: TransformationFromQuery) => {
      const options = processingConfigOptions(transformation)
      return (
        <Box>
          {compact(
            map(options, (option, index) => {
              // only show the first 3 options by defualt
              if (index < 3) {
                return options?.length - 1 === index || index === 2 ? (
                  <ProcessingItem
                    key={option.text}
                    text={option.text}
                    hoverContent={option.hoverContent}
                    withComma={false}
                  />
                ) : (
                  <ProcessingItem key={option.text} text={option.text} hoverContent={option.hoverContent} withComma />
                )
              }

              // show more option if third
              if (index === 3) {
                return (
                  <Popover
                    key={'more_than_3_option'}
                    title="Processing Configuration"
                    getPopupContainer={(trigger: HTMLElement) => trigger.parentNode as HTMLElement}
                    content={
                      <Box>
                        {map(options, (option) => (
                          <ProcessingItem
                            key={option.text}
                            text={option.text}
                            hoverContent={option.hoverContent}
                            withComma={false}
                          />
                        ))}
                      </Box>
                    }
                  >
                    <HoverBox>{` (+ ${options.length - 3} more)`}</HoverBox>
                  </Popover>
                )
              }

              // don't show options after the 3rd
              return null
            })
          )}
        </Box>
      )
    },
  }

  const actions: Column = {
    title: 'Actions',
    dataIndex: 'actions',
    key: 'actions',
    className: 'transformation-column-actions',
    filteredValue: filters['actions'] || defaultFilteredValue,
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInputRef}
          placeholder={`Search by SQL`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={(e) => {
            e.stopPropagation()
            confirm()
          }}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button type="primary" onClick={() => confirm()} icon={<SearchOutlined />} size="small" style={{ width: 90 }}>
            Search
          </Button>
          <Button
            onClick={() => {
              clearFilters?.()
              confirm()
            }}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => <SearchOutlined style={{ color: filtered ? colors.blue500 : undefined }} />,
    onFilter: (value, record) => {
      const sql = record.actions?.transformation?.current_query?.sql

      return sql?.toLowerCase().includes(value.toString().toLowerCase())
    },
    onFilterDropdownOpenChange: (visible: boolean) => {
      if (visible) {
        // when they open up the search
        // let them start typing (don't need to click into the search to start)
        setTimeout(() => searchInputRef?.current?.select(), 100)
      }
    },
    render: ({
      transformation,
      setTransformationItem,
      setDeleteTransformation,
      isCompanyAdmin,
    }: {
      transformation: TransformationFromQuery
      setTransformationItem: (item: TransformationFromQuery | undefined) => void
      setDeleteTransformation: (item: TransformationFromQuery | undefined) => void
      isCompanyAdmin: boolean
    }) => {
      return (
        <Flex alignItems="center">
          <CodeOutlined style={{ color: colors.gray500 }} onClick={() => setTransformationItem(transformation)} />

          {isCompanyAdmin && (
            <Flex alignItems="center">
              <Box px={1}>
                <Divider style={{ borderLeft: `1px solid ${colors.gray300}` }} type="vertical" />
              </Box>

              <DeleteOutlined
                style={{ color: colors.red500 }}
                onClick={() => setDeleteTransformation(transformation)}
                data-test={`delete-transformation-${snakeCase(transformation.name as string)}`}
              />
            </Flex>
          )}
        </Flex>
      )
    },
  }

  const columns: ColumnsType<any> = [
    name,
    kind,
    activities,
    updateType,
    lastPublished,
    processingConfiguration,
    actions,
  ]

  return columns
}

interface Props {
  transformations?: TransformationsFromQuery
  setTransformationItem: (item: TransformationFromQuery | undefined) => void
  setDeleteTransformation: (item: TransformationFromQuery | undefined) => void
}

const IndexTable = ({ transformations, setTransformationItem, setDeleteTransformation }: Props) => {
  const { notification } = App.useApp()
  const { isCompanyAdmin } = useUser()
  const { collapsed } = useLayoutContext()

  const [columns, setColumns] = useState<ColumnsType<any>>([])
  const [filters, setFilters] = useState<any>(DEFAULT_FILTERS)
  const prevFilters = usePrevious(filters)

  const [hasSetActivityFromParams, setHasSetActivityFromParams] = useState(false)

  const searchInputRef = useRef<InputRef>(null)

  const handleOnChange = useCallback((_pagination: unknown, newFilters: unknown) => {
    setFilters(newFilters)
  }, [])

  const tableData = useMemo(() => {
    return makeTableData({ transformations, setTransformationItem, setDeleteTransformation, isCompanyAdmin })
  }, [transformations, setTransformationItem, setDeleteTransformation, isCompanyAdmin])

  const allTables = useMemo(() => {
    const tables: { table: string; kind: string }[] = []

    each(transformations, (transformation) => {
      if (transformation?.table && transformation?.kind) {
        tables.push({ table: transformation?.table, kind: transformation?.kind })
      }
    })
    return sortBy(uniqBy(tables, 'table'), 'table')
  }, [transformations])

  const allActivities = useMemo(() => {
    const activities = new Set<string>()

    each(transformations, (transformation) => {
      each(transformation.activities, (activity) => {
        if (activity?.activity?.name) {
          activities.add(trim(activity.activity.name))
        }
      })
    })

    return [...activities].sort()
  }, [transformations])

  const allUpdateTypes = useMemo(() => {
    const updateTypes = new Set<string>()

    each(transformations, (transformation) => {
      if (transformation?.update_type) {
        updateTypes.add(transformation?.update_type)
      }
    })

    return [...updateTypes].sort()
  }, [transformations])

  const allTranformationUpdaters = useMemo(() => {
    const users = new Set<string>()

    each(transformations, (transformation) => {
      if (transformation?.production_queries?.[0]?.updated_by) {
        users.add(transformation?.production_queries?.[0]?.updated_by)
      }
    })

    return [...users].sort()
  }, [transformations])

  // set columns
  useEffect(() => {
    // set initial columns config
    if (!isEmpty(transformations) && !isEmpty(tableData) && isEmpty(columns)) {
      return setColumns(
        makeColumnsConfig({
          filters,
          allActivities,
          allTranformationUpdaters,
          allUpdateTypes,
          allTables,
          searchInputRef,
        })
      )
    }

    // update columns when filters change
    if (prevFilters && !isEqual(prevFilters, filters)) {
      return setColumns(
        makeColumnsConfig({
          filters,
          allActivities,
          allTranformationUpdaters,
          allUpdateTypes,
          allTables,
          searchInputRef,
        })
      )
    }
  }, [
    tableData,
    prevFilters,
    filters,
    makeColumnsConfig,
    allActivities,
    allTranformationUpdaters,
    allUpdateTypes,
    allTables,
  ])

  // if coming from the activity index with a pre-filtered activity name
  // add the filter to the transformation index
  useEffect(() => {
    if (!hasSetActivityFromParams && !isEmpty(location.search)) {
      const queryParams = queryString.parse(location.search)
      const sharedActivityName = queryParams?.[TRANSFORMATION_ACTIVITY_NAME_QUERY_PARAM_KEY]

      // if there is a sharedActivityName from params and it can be found
      if (sharedActivityName && includes(allActivities, sharedActivityName)) {
        // add the activity name to the filters
        setFilters({
          ...filters,
          activities: [sharedActivityName],
        })

        // make sure we only do it once
        setHasSetActivityFromParams(true)

        // and notify the user
        notification.info({
          key: `${TRANSFORMATION_ACTIVITY_NAME_QUERY_PARAM_KEY}-found`,
          message: (
            <Typography mr={1}>
              Transformations filtered by activity:{' '}
              <span style={{ fontWeight: semiBoldWeight }}>{sharedActivityName}</span>
            </Typography>
          ),
          placement: 'topRight',
        })
      }
    }
  }, [hasSetActivityFromParams, location.search, allActivities, filters])

  return (
    <Box>
      <StyledTable
        collapsed={collapsed}
        columns={columns as ColumnsType<any>}
        dataSource={tableData}
        pagination={false}
        onChange={handleOnChange}
      />
    </Box>
  )
}

export default IndexTable
