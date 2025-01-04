import { LockOutlined, SearchOutlined } from '@ant-design/icons'
import { App, Button, ConfigProvider, Empty, Input, Popover, Space, Tag } from 'antd-next'
import type { InputRef } from 'antd-next/es/input'
import { ColumnsType } from 'antd-next/es/table'
import { ColumnFilterItem } from 'antd-next/es/table/interface'
import { Table, tableFilterSearch } from 'components/antd/staged'
import { useCompany } from 'components/context/company/hooks'
import DatasetActions from 'components/Datasets/DatasetActions'
import DatasetFavoriteIcon from 'components/Datasets/DatasetFavoriteIcon'
import DatasetIndexContext from 'components/Datasets/DatasetIndexContext'
import DatasetLockedIcon from 'components/Datasets/DatasetLockedIcon'
import DatasetSearchBar from 'components/Datasets/DatasetSearchBar'
import ExploreIconDataset from 'components/Datasets/Explore/ExploreDatasetIcon'
import { DatasetFromQuery, DatasetsFromQuery } from 'components/Datasets/interfaces'
import UsedByCell from 'components/Datasets/UsedByCell'
import { FAVORITES, POPULAR, RECENTLY_VIEWED } from 'components/shared/IndexPages/constants'
import { ITag } from 'components/shared/IndexPages/interfaces'
import { Box, Flex, Link, Typography } from 'components/shared/jawns'
import { useLayoutContext } from 'components/shared/layout/LayoutProvider'
import ResourceStateIcon from 'components/shared/ResourceStateIcon'
import UserAvatar from 'components/shared/UserAvatar'
import { ICompany, ICompany_User, INarrative_Types_Enum, IStatus_Enum, IUser } from 'graph/generated'
import {
  compact,
  each,
  filter,
  find,
  includes,
  isEmpty,
  isEqual,
  isString,
  keys,
  map,
  some,
  startCase,
  toLower,
  truncate,
} from 'lodash'
import moment from 'moment-timezone'
import queryString from 'query-string'
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import styled from 'styled-components'
import { colors, semiBoldWeight, SIDENAV_WIDTH, SIDENAV_WIDTH_COLLAPSED } from 'util/constants'
import { getDatasetStatusLabel } from 'util/datasets'
import {
  ALL_BI_OPTIONS,
  BI_OTHER,
  INTEGRATION_TYPE_MATERIALIZED,
  INTEGRATION_TYPE_VIEW,
  INTEGRATIONS_CONFIG,
} from 'util/datasets/v2/integrations/constants'
import { makeBiToolLabel } from 'util/datasets/v2/integrations/helpers'
import { BiToolType } from 'util/datasets/v2/integrations/interfaces'
import { timeFromNow, userDisplayName } from 'util/helpers'
import usePrevious from 'util/usePrevious'

type Column = ColumnsType<any>[number]

export const SHARED_ACTIVITY_NAME_QUERY_PARAM_KEY = 'shared_activity_name'

const HEADER_HEIGHT = 64
const HEADER_Z_INDEX = 2
const CONTENT_Z_INDEX = 1

const NONE_FILTER_OPTION = 'none'
const NARRATIVES_FILTER_OPTION = 'narratives'
const DASHBOARDS_FILTER_OPTION = 'dashboards'
const HIDE_COLUMN_BREAKPOINTS = [1430, 1325, 1220, 1050, 965, 900]
const SIDENAV_WIDTH_DIFFERENCE = SIDENAV_WIDTH - SIDENAV_WIDTH_COLLAPSED

const HoverBox = styled(Box)`
  &:hover {
    cursor: default;
    color: ${colors.blue500};
  }
`

const NameContainer = styled(Box)`
  word-break: break-word;

  a {
    color: ${colors.black};

    &:hover {
      text-decoration: none;
      color: ${colors.blue500};
    }
  }
`

const StyledTable = styled(Table)<{ collapsed: boolean }>`
  ${({ collapsed }) => `
    @media only screen and (max-width: ${
      collapsed ? HIDE_COLUMN_BREAKPOINTS[0] - SIDENAV_WIDTH_DIFFERENCE : HIDE_COLUMN_BREAKPOINTS[0]
    }px) {
      .dataset-column-activities {
        display: none;
      }
    }

    @media only screen and (max-width: ${
      collapsed ? HIDE_COLUMN_BREAKPOINTS[1] - SIDENAV_WIDTH_DIFFERENCE : HIDE_COLUMN_BREAKPOINTS[1]
    }px) {
      .dataset-column-modified,
      .dataset-column-viewed {
        display: none;
      }
    }

    .dataset-column-tags {
      max-width: 350px;
    }
    @media only screen and (max-width: ${
      collapsed ? HIDE_COLUMN_BREAKPOINTS[2] - SIDENAV_WIDTH_DIFFERENCE : HIDE_COLUMN_BREAKPOINTS[2]
    }px) {
      .dataset-column-tags {
        display: none;
      }
    }

    @media only screen and (max-width: ${
      collapsed ? HIDE_COLUMN_BREAKPOINTS[3] - SIDENAV_WIDTH_DIFFERENCE : HIDE_COLUMN_BREAKPOINTS[3]
    }px) {
      .dataset-column-status {
        display: none;
      }
    }

    @media only screen and (max-width: ${
      collapsed ? HIDE_COLUMN_BREAKPOINTS[4] - SIDENAV_WIDTH_DIFFERENCE : HIDE_COLUMN_BREAKPOINTS[4]
    }px) {
      .dataset-column-actions {
        display: none;
      }
    }

    @media only screen and (max-width: ${
      collapsed ? HIDE_COLUMN_BREAKPOINTS[5] - SIDENAV_WIDTH_DIFFERENCE : HIDE_COLUMN_BREAKPOINTS[5]
    }px) {
      .dataset-column-used-by {
        display: none;
      }
    }

`}
`

type DatasetTags = DatasetFromQuery['tags']
type DatasetActivities = DatasetFromQuery['dataset_activities']
type DatasetIntegrations = DatasetFromQuery['materializations']
type DatasetNarratives = DatasetFromQuery['dependent_narratives']

interface DatasetIndexSectionProps {
  datasets: DatasetsFromQuery
}

const DEFAULT_FILTERS = {
  activities: null,
  used_by: null,
  tags: null,
}

const BI_TOOLS = 'bi_tools'

const makeColumnsConfig = ({
  sharedTags = [],
  allDatasetActivities,
  filters = DEFAULT_FILTERS,
  selectedMenuItem,
  searchInputRef,
  allDatasetCreators,
}: {
  sharedTags?: ITag[]
  allDatasetActivities?: string[]
  filters?: Record<string, string[] | null>
  selectedMenuItem?: string
  searchInputRef: React.RefObject<InputRef>
  allDatasetCreators: IUser[]
}): ColumnsType<any> => {
  // antd wants filteredValue passed to all columns if any have a filter
  const hasAnyFilters = some(filters, (val) => !!val)
  const defaultFilteredValue = hasAnyFilters ? [] : null

  const createdBy: Column = {
    title: 'User',
    dataIndex: 'createdBy',
    key: 'createdBy',
    width: '36px',
    filteredValue: filters['createdBy'] || defaultFilteredValue,
    filters: [
      ...map(allDatasetCreators, (creator) => {
        const companyUser = creator?.company_users?.[0]
        const nameOrEmail = userDisplayName(companyUser?.first_name, companyUser?.last_name, creator.email)
        return { text: nameOrEmail, value: creator.id }
      }),
    ],
    onFilter: (value, record) => {
      // if no users have been filtered for, show all
      if (isEmpty(value)) {
        return true
      }

      // otherwise, see if the dataset was created by user
      return record.createdBy?.created_by === value
    },
    filterSearch: (input, record) => tableFilterSearch(input, record),
    render: (dataset: DatasetFromQuery) => {
      return (
        <UserAvatar
          user={dataset.user as IUser}
          companyUser={dataset.user?.company_users?.[0] as ICompany_User}
          showName={false}
        />
      )
    },
  }

  const name: Column = {
    title: 'Name',
    dataIndex: 'name',
    className: 'dataset-table-header-name',
    key: 'name',
    filteredValue: filters['name'] || defaultFilteredValue,
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInputRef}
          placeholder={`Search by Name or Description`}
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
      const name = record['name']?.dataset?.name
      const description = record['name']?.dataset?.description

      if (typeof value !== 'string') {
        return false
      }

      return (
        name?.toLowerCase().includes(value.toLowerCase()) || description?.toLowerCase().includes(value.toLowerCase())
      )
    },
    onFilterDropdownOpenChange: (visible: boolean) => {
      if (visible) {
        // when they open up the search
        // let them start typing (don't need to click into the search to start)
        setTimeout(() => searchInputRef?.current?.select(), 100)
      }
    },
    render: ({ dataset }: { dataset: DatasetFromQuery }) => (
      <NameContainer>
        <Flex alignItems="center">
          {dataset.locked && (
            <Box mr={1}>
              <DatasetLockedIcon />
            </Box>
          )}
          <Box>
            <Link to={`/datasets/edit/${dataset.slug}`} unstyled data-test="dataset-index-name-link">
              {dataset.name}
            </Link>

            {dataset.description && (
              <Typography
                color={colors.gray600}
                type="body300"
                title={dataset.description.length > 150 ? dataset.description : undefined}
              >
                {truncate(dataset.description, { length: 150 })}
              </Typography>
            )}
          </Box>
        </Flex>
      </NameContainer>
    ),
    sorter: (a: any, b: any) => a?.name?.dataset?.name?.localeCompare(b?.name?.dataset?.name),
  }

  const status: Column = {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    className: 'dataset-column-status',
    render: ({ status }: { status: IStatus_Enum; locked: boolean }) => {
      return getDatasetStatusLabel({ status })
    },
    filteredValue: filters['status'] || defaultFilteredValue,
    filters: [
      {
        text: (
          <Flex alignItems="center">
            <Typography mr={1}>{getDatasetStatusLabel({ status: IStatus_Enum.InProgress })}</Typography>
            <ResourceStateIcon state={IStatus_Enum.InProgress} hideTooltip />
          </Flex>
        ),
        value: IStatus_Enum.InProgress,
      },
      {
        text: (
          <Flex alignItems="center">
            <Typography mr={1}>{getDatasetStatusLabel({ status: IStatus_Enum.Live })}</Typography>
            <ResourceStateIcon state={IStatus_Enum.Live} hideTooltip />
          </Flex>
        ),
        value: IStatus_Enum.Live,
      },
      {
        text: (
          <Flex alignItems="center">
            <Typography mr={1}>Locked</Typography>
            <LockOutlined />
          </Flex>
        ),
        value: 'locked',
      },
    ],
    onFilter: (value, record) => {
      // if status not filtered for, show all
      if (isEmpty(value)) {
        return true
      }

      // check if searching for "locked"
      if (value === 'locked' && record.status.locked) {
        return true
      }

      // check if dataset has status from filter
      return record.status.status === value
    },
  }

  const tags: Column = {
    title: 'Tags',
    dataIndex: 'tags',
    key: 'tags',
    className: 'dataset-column-tags',
    filteredValue: filters['tags'] || defaultFilteredValue,
    filters: [
      ...map(sharedTags, (tag) => ({ text: tag.tag, value: tag.tag })),
      { text: startCase(NONE_FILTER_OPTION), value: NONE_FILTER_OPTION },
    ],
    onFilter: (value, record) => {
      // if no tags have been filtered for, show all
      if (isEmpty(value)) {
        return true
      }

      // if "none" was selected, return datasets w/o tags
      if (value === NONE_FILTER_OPTION && isEmpty(record.tags?.tags)) {
        return true
      }

      // otherwise, see if the record contains that tag
      return some(record.tags?.tags, (tag) => tag.company_tag?.tag === value)
    },
    filterSearch: (input, record) => tableFilterSearch(input, record),
    render: ({ tags }: { tags: DatasetTags }) => (
      <Flex flexWrap="wrap" style={{ rowGap: '8px' }}>
        {map(tags, (tag) => (
          <Tag key={tag.id} color={tag?.company_tag?.color || 'default'}>
            <Typography
              fontSize="12px"
              lineHeight="20px"
              title={
                tag?.company_tag?.tag?.length && tag?.company_tag?.tag?.length > 24 ? tag?.company_tag?.tag : undefined
              }
            >
              {truncate(tag?.company_tag?.tag, { length: 24 })}
            </Typography>
          </Tag>
        ))}
      </Flex>
    ),
  }

  const modified: Column = {
    title: 'Modified',
    dataIndex: 'modified',
    key: 'modified',
    className: 'dataset-column-modified',
    render: ({ timeAgo }: { timeAgo: string }) => timeAgo,
    sorter: (a: any, b: any) => {
      // moment's unix doesn't handle null very well (returns NaN)
      // force null values to be 1 for sorting
      const aUnix = moment.utc(a?.modified?.lastUpdatedAt).unix()
      const aUnixClean = isFinite(aUnix) ? aUnix : 1
      const bUnix = moment.utc(b?.modified?.lastUpdatedAt).unix()
      const bUnixClean = isFinite(bUnix) ? bUnix : 1

      return aUnixClean - bUnixClean
    },
  }

  const viewed: Column = {
    title: 'Viewed',
    dataIndex: 'viewed',
    key: 'viewed',
    className: 'dataset-column-viewed',
    render: ({ timeAgo }: { timeAgo: string }) => timeAgo,
    sorter: (a: any, b: any) => {
      // moment's unix doesn't handle null very well (returns NaN)
      // force null values to be 1 for sorting
      const aUnix = moment.utc(a?.viewed?.lastViewedAt).unix()
      const aUnixClean = isFinite(aUnix) ? aUnix : 1
      const bUnix = moment.utc(b?.viewed?.lastViewedAt).unix()
      const bUnixClean = isFinite(bUnix) ? bUnix : 1

      return aUnixClean - bUnixClean
    },
  }

  const activities: Column = {
    title: 'Activities',
    dataIndex: 'activities',
    className: 'dataset-column-activities',
    key: 'activities',
    filteredValue: filters['activities'] || defaultFilteredValue,
    filters: map(allDatasetActivities, (act) => ({ text: act, value: act })),
    onFilter: (value, record) => {
      // if no activities have been filtered for, show all
      if (isEmpty(value)) {
        return true
      }

      // if there was an activity filter, but dataset has no activities
      // don't show it
      if (isEmpty(record.activities)) {
        return false
      }

      // otherwise, see if the record contains that activity
      return some(record.activities, (activity) => activity.activity?.name === value)
    },
    filterSearch: (input, record) => tableFilterSearch(input, record),
    render: (activities: DatasetActivities) => (
      <Box>
        {!isEmpty(activities) &&
          compact(
            map(activities, (act, index) => {
              // only show the first 3 activities by defualt
              if (index < 3) {
                return activities.length - 1 === index || index === 2 ? (
                  <Box key={act.activity.id}>{act.activity.name}</Box>
                ) : (
                  <Box key={act.activity.id}>{`${act.activity.name}, `}</Box>
                )
              }

              // show more option if third
              if (index === 3) {
                return (
                  <Popover
                    title="Activities"
                    key={act.activity.id}
                    getPopupContainer={(trigger: HTMLElement) => trigger.parentNode as HTMLElement}
                    content={
                      <Box>
                        {map(activities, (act) => (
                          <Typography key={act.activity.id} style={{ whiteSpace: 'nowrap' }}>
                            {act.activity.name}
                          </Typography>
                        ))}
                      </Box>
                    }
                  >
                    <HoverBox>{` (+ ${activities.length - 3} more)`}</HoverBox>
                  </Popover>
                )
              }

              // don't show activities after the 3rd
              return null
            })
          )}
      </Box>
    ),
  }

  const visualizationOptions = {
    text: 'Visualizations',
    value: 'visualizations',
    children: [
      { text: 'Analyses', value: NARRATIVES_FILTER_OPTION },
      { text: startCase(DASHBOARDS_FILTER_OPTION), value: DASHBOARDS_FILTER_OPTION },
    ],
  }

  const integrationFilterOptions = {
    text: 'Integrations',
    value: 'integrations',
    children: [
      ...map(keys(INTEGRATIONS_CONFIG), (integrationKey) => ({
        text: INTEGRATIONS_CONFIG[integrationKey].displayName,
        value: integrationKey,
      })),
    ],
  }

  const biIntegrationFilterOptions = {
    text: 'BI Tools',
    value: BI_TOOLS,
    children: [
      ...map(ALL_BI_OPTIONS, (op: BiToolType) => ({
        text: makeBiToolLabel(op),
        value: op,
      })),
    ],
  }

  const usedByFilters = [
    visualizationOptions,
    integrationFilterOptions,
    biIntegrationFilterOptions,
    { text: startCase(NONE_FILTER_OPTION), value: NONE_FILTER_OPTION },
  ] as ColumnFilterItem[]

  const usedBy: Column = {
    title: 'Used by',
    dataIndex: 'used_by',
    key: 'used_by',
    className: 'dataset-column-used-by',
    render: ({ integrations, narratives }: { integrations: DatasetIntegrations; narratives: DatasetNarratives }) => {
      return <UsedByCell integrations={integrations} narratives={narratives} />
    },
    filteredValue: filters['used_by'] || defaultFilteredValue,
    filterMode: 'tree',
    filters: usedByFilters,
    filterSearch: (input, record) => tableFilterSearch(input, record),
    onFilter: (value, record) => {
      // if no integrations/narratives have been filtered for, show all
      if (isEmpty(value)) {
        return true
      }

      const {
        used_by: { integrations, narratives },
      } = record

      // check for BI Integrations
      if (
        isString(value) &&
        includes(ALL_BI_OPTIONS, value) &&
        some(integrations, (int) => includes(toLower(int.webhook_url), toLower(value)))
      ) {
        return true
      }

      // check for Other BI Intergrations
      // only Materialized Views and Views with webhook_urls
      if (
        isString(value) &&
        value === BI_OTHER &&
        some(
          integrations,
          (int) =>
            includes([INTEGRATION_TYPE_MATERIALIZED, INTEGRATION_TYPE_VIEW], int.type) && !isEmpty(int.webhook_url)
        )
      ) {
        return true
      }

      // if "none" was selected, return datasets w/o integrations/narratives
      if (value === NONE_FILTER_OPTION && isEmpty(integrations) && isEmpty(narratives)) {
        return true
      }

      const nonDashboardNarratives = filter(
        narratives,
        (nar) => nar?.narrative?.type !== INarrative_Types_Enum.Dashboard
      )
      const dashboards = filter(narratives, (nar) => nar?.narrative?.type === INarrative_Types_Enum.Dashboard)

      // check if dataset has an integration, narrative, or dashboard from filter
      return (
        some(integrations, (int) => int.type === value) ||
        (!isEmpty(nonDashboardNarratives) && value === NARRATIVES_FILTER_OPTION) ||
        (!isEmpty(dashboards) && value === DASHBOARDS_FILTER_OPTION)
      )
    },
  }

  const actions: Column = {
    title: 'Actions',
    dataIndex: 'actions',
    key: 'actions',
    className: 'dataset-column-actions',
    render: (dataset: DatasetFromQuery) => (
      <Flex>
        <Box mr={1}>
          <ExploreIconDataset datasetSlug={dataset.slug} />
        </Box>
        <DatasetFavoriteIcon dataset={dataset} />
        <DatasetActions dataset={dataset} />
      </Flex>
    ),
  }

  let columns: ColumnsType<any> = [createdBy, name, status, tags]

  // show "viewed at" for recently viewed
  if (selectedMenuItem === RECENTLY_VIEWED) {
    columns.push(viewed)
  }

  // show "modified" for everything else except popular
  if (selectedMenuItem !== RECENTLY_VIEWED && selectedMenuItem !== POPULAR) {
    columns.push(modified)
  }

  // add rest of columns after ^^ conditional columns
  columns = [...columns, activities, usedBy, actions] as ColumnsType<any>

  return columns
}

const makeTableData = ({ datasets, company }: { datasets: DatasetsFromQuery; company: ICompany }) => {
  return map(datasets, (dataset) => ({
    key: dataset.id,
    createdBy: dataset,
    name: { dataset },
    status: { status: dataset.status, locked: dataset.locked },
    // TODO: as nested loop is it more performant (big O)
    // to conditionally render in COLUMNS_CONFIG ??
    tags: {
      tags: filter(
        dataset.tags,
        (tag) =>
          tag?.company_tag?.tag !== FAVORITES &&
          tag?.company_tag?.tag !== RECENTLY_VIEWED &&
          tag?.company_tag?.tag !== POPULAR
      ),
    },
    modified: {
      lastUpdatedAt: dataset.last_config_updated_at,
      timeAgo: timeFromNow(dataset.last_config_updated_at, company.timezone),
    },
    viewed: {
      lastViewedAt: find(dataset.tags, ['company_tag.tag', RECENTLY_VIEWED])?.updated_at,
      timeAgo: timeFromNow(find(dataset.tags, ['company_tag.tag', RECENTLY_VIEWED])?.updated_at, company.timezone),
    },
    activities: dataset.dataset_activities,
    used_by: {
      integrations: dataset.materializations,
      // graph will return null dependent narratives
      // for narratives the user doesn't have access to
      // Remove those null narratives
      narratives: filter(dataset.dependent_narratives, (nar) => !isEmpty(nar.narrative)),
    },
    actions: dataset,
  }))
}

const DatasetIndexSection: React.FC<DatasetIndexSectionProps> = ({ datasets }) => {
  const { notification } = App.useApp()
  const company = useCompany()
  const location = useLocation()
  const { collapsed } = useLayoutContext()
  const { sharedTags, tagsLoading, datasetsLoading, selectedFilter: selectedMenuItem } = useContext(DatasetIndexContext)
  const [columns, setColumns] = useState<ColumnsType<any>>([])
  const [filters, setFilters] = useState<any>(DEFAULT_FILTERS)
  const prevFilters = usePrevious(filters)
  const prevSelectedMenuItem = usePrevious(selectedMenuItem)
  const searchInputRef = useRef<InputRef>(null)

  const [hasSetActivityFromParams, setHasSetActivityFromParams] = useState(false)

  const data = useMemo(() => {
    return makeTableData({ datasets, company })
  }, [datasets, company])

  const allDatasetCreators = useMemo(() => {
    const users = new Set<IUser>()

    each(datasets, (dataset) => {
      if (dataset.user?.id) {
        users.add(dataset.user as IUser)
      }
    })

    return [...users]
  }, [datasets])

  const allDatasetActivities = useMemo(() => {
    const activities = new Set<string>()

    each(datasets, (dataset) => {
      each(dataset.dataset_activities, (activity) => {
        if (activity?.activity?.name) {
          activities.add(activity.activity.name)
        }
      })
    })

    return [...activities]
  }, [datasets])

  // if coming from the activity index with a pre-filtered activity name
  // add the filter to the dataset index
  useEffect(() => {
    if (!hasSetActivityFromParams && !isEmpty(location.search)) {
      const queryParams = queryString.parse(location.search)
      const sharedActivityName = queryParams?.[SHARED_ACTIVITY_NAME_QUERY_PARAM_KEY]

      // if there is a sharedActivityName from params and it can be found
      if (sharedActivityName && includes(allDatasetActivities, sharedActivityName)) {
        // add the activity name to the filters
        setFilters({
          ...filters,
          activities: [sharedActivityName],
        })

        // make sure we only do it once
        setHasSetActivityFromParams(true)

        // and notify the user
        notification.info({
          key: `${SHARED_ACTIVITY_NAME_QUERY_PARAM_KEY}-found`,
          message: (
            <Typography mr={1}>
              Datasets filtered by activity: <span style={{ fontWeight: semiBoldWeight }}>{sharedActivityName}</span>
            </Typography>
          ),
          placement: 'topRight',
        })
      }
    }
  }, [hasSetActivityFromParams, location.search, allDatasetActivities, filters, notification])

  const handleOnChange = (_pagination: unknown, filters: unknown) => {
    setFilters(filters)
  }

  const handleRenderEmpty = useCallback(() => {
    if (selectedMenuItem === RECENTLY_VIEWED) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Box>
              <Typography type="title300" mb={2}>
                New to Narrator?
              </Typography>
              <Typography mb={2}>
                View all the{' '}
                <Link as="span" to="/datasets/all_shared">
                  shared datasets
                </Link>
              </Typography>
              <Typography mb={2}>or</Typography>
              <Link to="/datasets/new">
                <Button type="primary">Create a new dataset</Button>
              </Link>
            </Box>
          }
        />
      )
    }

    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data" />
  }, [selectedMenuItem])

  useEffect(() => {
    // initialize columns
    if (isEmpty(columns) && !datasetsLoading && !tagsLoading) {
      const initialColumns = makeColumnsConfig({
        sharedTags,
        allDatasetActivities,
        filters,
        selectedMenuItem,
        searchInputRef,
        allDatasetCreators,
      }) as ColumnsType<any>
      return setColumns(initialColumns)
    }

    // clear out filters if changing tabs (i.e. All Mine -> Favorites)
    if (prevSelectedMenuItem && !isEqual(prevSelectedMenuItem, selectedMenuItem)) {
      const columnsWithoutFilters = makeColumnsConfig({
        sharedTags,
        allDatasetActivities,
        filters: DEFAULT_FILTERS,
        selectedMenuItem,
        searchInputRef,
        allDatasetCreators,
      }) as ColumnsType<any>
      return setColumns(columnsWithoutFilters)
    }

    // update columns when filters change
    if (prevFilters && !isEqual(prevFilters, filters)) {
      const columnsWithFilters = makeColumnsConfig({
        sharedTags,
        allDatasetActivities,
        filters,
        selectedMenuItem,
        searchInputRef,
        allDatasetCreators,
      }) as ColumnsType<any>
      return setColumns(columnsWithFilters)
    }
  }, [
    datasetsLoading,
    tagsLoading,
    columns,
    sharedTags,
    allDatasetCreators,
    allDatasetActivities,
    prevFilters,
    filters,
    prevSelectedMenuItem,
    selectedMenuItem,
  ])

  return (
    <>
      <Flex
        alignItems="center"
        justifyContent="space-between"
        style={{
          position: 'sticky',
          top: 0,
          height: HEADER_HEIGHT,
          zIndex: HEADER_Z_INDEX,
        }}
      >
        <DatasetSearchBar extraSelectProps={{ withTallerMenu: true }} />

        <Link to="/datasets/new" data-test="create-new-dataset-cta">
          <Button type="primary">Create New</Button>
        </Link>
      </Flex>

      <Box
        style={{
          position: 'sticky',
          top: HEADER_HEIGHT,
          height: `calc(100vh - ${HEADER_HEIGHT}px)`,
          overflowY: 'auto',
          zIndex: CONTENT_Z_INDEX,
          paddingBottom: '120px', // extra padding to escape the help scout
        }}
      >
        {/* Over-ride antds table empty https://stackoverflow.com/a/63167320 */}
        <ConfigProvider renderEmpty={handleRenderEmpty}>
          <StyledTable
            columns={columns as ColumnsType<any>}
            dataSource={data}
            onChange={handleOnChange}
            collapsed={collapsed}
          />
        </ConfigProvider>
      </Box>
    </>
  )
}

export default DatasetIndexSection
