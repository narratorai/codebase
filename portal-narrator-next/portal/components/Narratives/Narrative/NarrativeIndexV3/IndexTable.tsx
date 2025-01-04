import { HeartTwoTone, HistoryOutlined, SearchOutlined } from '@ant-design/icons'
import { InputRef } from 'antd/lib/input'
import { ColumnGroupType, ColumnsType, ColumnType } from 'antd/lib/table'
import { Badge, Button, Input, Popover, Space, Table, Tag, Tooltip } from 'antd-next'
import { tableFilterSearch } from 'components/antd/staged'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import EditNarrativeIconLink from 'components/Narratives/EditNarrativeIconLink'
import ActionableIcon from 'components/Narratives/shared/ActionableIcon'
import AssembledBadge from 'components/Narratives/shared/AssembledBadge'
import { FAVORITES, NON_SHARED_TAGS, RECENTLY_VIEWED } from 'components/shared/IndexPages/constants'
import { ITag } from 'components/shared/IndexPages/interfaces'
import { Box, Flex, Link, Typography } from 'components/shared/jawns'
import ResourceStateIcon from 'components/shared/ResourceStateIcon'
import { ICompany, INarrative, IStatus_Enum } from 'graph/generated'
import { find, includes, isBoolean, isEmpty, isEqual, isFinite, map, some, startCase, truncate } from 'lodash'
import moment from 'moment-timezone'
import { RefObject, useContext, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { colors, PINK_HEART_COLOR } from 'util/constants'
import { timeFromNow, withinWeekAgo } from 'util/helpers'
import usePrevious from 'util/usePrevious'

import { getNarrativeStatusLabel } from './helpers'
import { NarrativesType, NarrativeType } from './interfaces'
import NarrativeFavoriteIcon from './NarrativeFavoriteIcon'
import NarrativeIndexContext from './NarrativeIndexContext'
import NarrativeOptionsIcon from './NarrativeOptionsIcon'
import RunNarrativeIcon from './RunNarrativeIcon'

type Column = ColumnGroupType<any> | ColumnType<any>
type NarrativeTags = NarrativeType['tags']

const NONE_FILTER_OPTION = 'none'
const ACTIONABLE_OPTION = 'actionable_option'
const NOT_SCHEDULED_OPTION = 'not_scheduled_option'
const RECENTLY_RUN_OPTION = 'recently_run_option'
const NOT_RECENTLY_RUN_OPTION = 'not_recently_run_option'

const NameTitle = styled(Typography)<{ isAssembled: boolean }>`
  font-weight: 400;
  font-size: 16px;

  a {
    color: black;
  }

  &:hover {
    color: ${({ isAssembled }) => (isAssembled ? colors.blue500 : colors.gray500)} !important;
  }
`

interface MakeTableDataProps {
  narratives?: NarrativesType
  isCompanyAdmin: boolean
  company: ICompany
  refetchNarratives: () => void
}

const makeTableData = ({ narratives, isCompanyAdmin, company, refetchNarratives }: MakeTableDataProps) => {
  return narratives?.map((narrative) => ({
    key: narrative.id,
    schedule: narrative,
    name: narrative,
    status: { narrative, isFavorited: !!find(narrative.tags, ['company_tag.tag', FAVORITES]) },
    tags: narrative.tags?.filter((tag) => !includes(NON_SHARED_TAGS, tag?.company_tag?.tag)),
    createdAt: {
      createdAt: narrative.created_at,
      timeAgo: timeFromNow(narrative.created_at, company.timezone),
    },
    lastViewedAt: {
      narrative,
      timezone: company.timezone,
    },
    lastAssembledAt: {
      narrative,
      timezone: company.timezone,
    },
    actions: { narrative, isCompanyAdmin, refetchNarratives },
  }))
}

///////

interface MakeColumnsConfigProps {
  filters?: Record<string, string[] | null>
  searchInputRef: RefObject<InputRef>
  sharedTags?: ITag[]
}

const makeColumnsConfig = ({
  filters = DEFAULT_FILTERS,
  searchInputRef,
  sharedTags,
}: MakeColumnsConfigProps): ColumnsType<any> => {
  // antd wants filteredValue passed to all columns if any have a filter
  const defaultFilteredValue = isEmpty(filters) ? [] : null

  const schedule: Column = {
    title: <HistoryOutlined />,
    dataIndex: 'schedule',
    key: 'schedule',
    className: 'dataset-column-schedule',
    filteredValue: filters['schedule'] || defaultFilteredValue,
    width: 64,
    filters: [
      {
        text: (
          <Flex alignItems="center">
            <Typography mr={1}>Actionable</Typography>
            <ActionableIcon isActionable />
          </Flex>
        ),
        value: ACTIONABLE_OPTION,
      },
      {
        text: (
          <Flex alignItems="center">
            <Typography mr={1}>Recently Run</Typography>
            <Badge status="success" />
          </Flex>
        ),
        value: RECENTLY_RUN_OPTION,
      },
      {
        text: (
          <Flex alignItems="center">
            <Typography mr={1}>Not Recently Run</Typography>
            <Badge status="warning" />
          </Flex>
        ),
        value: NOT_RECENTLY_RUN_OPTION,
      },
      {
        text: (
          <Flex alignItems="center">
            <Typography mr={1}>Not Scheduled</Typography>
            <Badge status="default" />
          </Flex>
        ),
        value: NOT_SCHEDULED_OPTION,
      },
    ],
    onFilter: (value, record) => {
      // if schedule not filtered for, show all
      if (isEmpty(value)) {
        return true
      }

      // check if actionable
      if (value === ACTIONABLE_OPTION && record['status']?.narrative?.narrative_runs[0]?.is_actionable) {
        return true
      }

      const scheduledToRun = !!record['status']?.narrative.company_task?.schedule

      // check if not scheduled to run (gray)
      if (value === NOT_SCHEDULED_OPTION && !scheduledToRun) {
        return true
      }

      const lastAssembled = record['status']?.narrative?.narrative_runs[0]?.created_at
      const recentlyRun = lastAssembled && withinWeekAgo(lastAssembled)

      // check if recently run (green)
      // (must also be scheduled to run)
      if (value === RECENTLY_RUN_OPTION && scheduledToRun && recentlyRun) {
        return true
      }

      // check if not recently run (yellow)
      // (must also be scheduled to run)
      if (value === NOT_RECENTLY_RUN_OPTION && scheduledToRun && !recentlyRun) {
        return true
      }

      // otherwise nothing matched
      return false
    },
    render: (narrative: NarrativeType) => {
      const isActionable = narrative?.narrative_runs[0]?.is_actionable

      return (
        <Flex flexDirection="column" alignItems="center" mr={1}>
          <AssembledBadge narrative={narrative} />

          {/* only show non-null actionable - otherwise actionability hasn't been determined */}
          {isBoolean(isActionable) && (
            <Popover
              placement="top"
              content={
                <Typography>
                  {isActionable ? 'This narrative is actionable.' : 'This narrative is not actionable yet.'}
                </Typography>
              }
            >
              <Box>
                <ActionableIcon isActionable={isActionable} />
              </Box>
            </Popover>
          )}
        </Flex>
      )
    },
  }

  const name: Column = {
    title: 'Name',
    dataIndex: 'name',
    className: 'narrative-column-name',
    key: 'name',
    filteredValue: filters['name'] || defaultFilteredValue,
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }} data-test="search-narratives-dropdown">
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
    filterIcon: (filtered: boolean) => (
      <SearchOutlined
        style={{ color: filtered ? colors.blue500 : undefined }}
        data-test="search-narratives-filter-icon"
      />
    ),
    onFilter: (value, record) => {
      const name = record['name']?.name
      const description = record['name']?.description

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
    render: (narrative: NarrativeType) => {
      const isAssembled = !isEmpty(narrative.narrative_runs)

      return (
        <Box>
          {isAssembled && (
            <Link to={`/narratives/a/${narrative.slug}`} unstyled style={{ color: 'black' }}>
              <NameTitle data-test="narrative-item-name" isAssembled={isAssembled}>
                {narrative.name}
              </NameTitle>
            </Link>
          )}

          {!isAssembled && (
            <Tooltip title="The narrative has never been assembled." placement="topLeft">
              <NameTitle data-test="narrative-item-name" isAssembled={isAssembled}>
                {narrative.name}
              </NameTitle>
            </Tooltip>
          )}

          {narrative.description && (
            <Typography
              color={colors.gray600}
              type="body300"
              title={narrative.description.length > 120 ? narrative.description : undefined}
            >
              {truncate(narrative.description, { length: 120 })}
            </Typography>
          )}
        </Box>
      )
    },
    sorter: (a: any, b: any) => a?.name?.name?.localeCompare(b?.name?.name),
  }

  const status: Column = {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    className: 'narrative-column-status',
    render: ({ narrative }: { narrative: NarrativeType }) => {
      const status = narrative.state
      return getNarrativeStatusLabel({ status })
    },
    filteredValue: filters['status'] || defaultFilteredValue,
    filters: [
      {
        text: (
          <Flex alignItems="center">
            <Typography mr={1}>{getNarrativeStatusLabel({ status: IStatus_Enum.InProgress })}</Typography>
            <ResourceStateIcon state={IStatus_Enum.InProgress} hideTooltip />
          </Flex>
        ),
        value: IStatus_Enum.InProgress,
      },
      {
        text: (
          <Flex alignItems="center">
            <Typography mr={1}>{getNarrativeStatusLabel({ status: IStatus_Enum.Live })}</Typography>
            <ResourceStateIcon state={IStatus_Enum.Live} hideTooltip />
          </Flex>
        ),
        value: IStatus_Enum.Live,
      },
      {
        text: (
          <Flex alignItems="center">
            <Typography mr={1}>Favorited</Typography>
            <HeartTwoTone twoToneColor={PINK_HEART_COLOR} />
          </Flex>
        ),
        value: FAVORITES,
      },
    ],
    onFilter: (value, record) => {
      // if status not filtered for, show all
      if (isEmpty(value)) {
        return true
      }

      // check if favorited
      if (value === FAVORITES && record['status']?.isFavorited) {
        return true
      }

      // check if narrative has status from filter
      return record['status']?.narrative?.state === value
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

      // if "none" was selected, return narratives w/o tags
      if (value === NONE_FILTER_OPTION && isEmpty(record.tags?.tags)) {
        return true
      }

      // otherwise, see if the record contains that tag
      return some(record.tags, (tag) => tag.company_tag?.tag === value)
    },
    filterSearch: (input, record) => tableFilterSearch(input, record),
    render: (tags: NarrativeTags) => (
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

  const createdAt: Column = {
    title: 'Created',
    dataIndex: 'createdAt',
    key: 'createdAt',
    className: 'narrative-column-createdAt',
    render: ({ timeAgo }: { timeAgo: string }) => timeAgo,
    sorter: (a: any, b: any) => {
      // moment's unix doesn't handle null very well (returns NaN)
      // force null values to be 1 for sorting
      const aUnix = moment.utc(a?.createdAt?.createdAt).unix()
      const aUnixClean = isFinite(aUnix) ? aUnix : 1
      const bUnix = moment.utc(b?.createdAt?.createdAt).unix()
      const bUnixClean = isFinite(bUnix) ? bUnix : 1

      return aUnixClean - bUnixClean
    },
  }

  const lastViewedAt: Column = {
    title: 'Viewed',
    dataIndex: 'lastViewedAt',
    key: 'lastViewedAt',
    className: 'narrative-column-lastViewedAt',
    render: ({ narrative, timezone }: { narrative: NarrativeType; timezone: string }) => {
      const lastViewd = find(narrative.tags, ['company_tag.tag', RECENTLY_VIEWED])?.updated_at
      if (lastViewd) {
        return timeFromNow(lastViewd, timezone)
      }

      return 'Never Viewed'
    },
    sorter: (a: any, b: any) => {
      // moment's unix doesn't handle null very well (returns NaN)
      // force null values to be 1 for sorting
      const lastViewedA = find(a?.lastViewedAt?.narrative?.tags, ['company_tag.tag', RECENTLY_VIEWED])?.updated_at
      const lastViewedB = find(b?.lastViewedAt?.narrative?.tags, ['company_tag.tag', RECENTLY_VIEWED])?.updated_at

      const aUnix = moment.utc(lastViewedA).unix()
      const aUnixClean = isFinite(aUnix) ? aUnix : 1
      const bUnix = moment.utc(lastViewedB).unix()
      const bUnixClean = isFinite(bUnix) ? bUnix : 1

      return aUnixClean - bUnixClean
    },
  }

  const lastAssembledAt: Column = {
    title: 'Assembled',
    dataIndex: 'lastAssembledAt',
    key: 'lastAssembledAt',
    className: 'narrative-column-lastAssembledAt',
    render: ({ narrative, timezone }: { narrative: NarrativeType; timezone: string }) => {
      const lastAssembledAt = narrative.narrative_runs?.[0]?.created_at

      if (lastAssembledAt) {
        return timeFromNow(lastAssembledAt, timezone)
      }

      return 'Never Assembled'
    },
    sorter: (a: any, b: any) => {
      // moment's unix doesn't handle null very well (returns NaN)
      // force null values to be 1 for sorting
      const lastAssembledA = a?.lastAssembledAt?.narrative?.narrative_runs?.[0]?.created_at
      const lastAssembledB = b?.lastAssembledAt?.narrative?.narrative_runs?.[0]?.created_at

      const aUnix = moment.utc(lastAssembledA).unix()
      const aUnixClean = isFinite(aUnix) ? aUnix : 1
      const bUnix = moment.utc(lastAssembledB).unix()
      const bUnixClean = isFinite(bUnix) ? bUnix : 1

      return aUnixClean - bUnixClean
    },
  }

  const actions: Column = {
    title: 'Actions',
    dataIndex: 'actions',
    key: 'actions',
    className: 'narrative-column-actions',
    render: ({ narrative, refetchNarratives }: { narrative: NarrativeType; refetchNarratives: () => void }) => (
      <Flex>
        <Box mr={1}>
          <RunNarrativeIcon narrative={narrative} />
        </Box>

        <Box mr={1}>
          <NarrativeFavoriteIcon narrative={narrative} onSuccess={refetchNarratives} />
        </Box>

        <Box mr={1}>
          <EditNarrativeIconLink narrative={narrative as INarrative} />
        </Box>

        <Box>
          <NarrativeOptionsIcon narrative={narrative} />
        </Box>
      </Flex>
    ),
  }

  return [schedule, name, status, tags, createdAt, lastViewedAt, lastAssembledAt, actions]
}

const DEFAULT_FILTERS = {
  schedule: null,
  name: null,
  status: null,
  tags: null,
  createdAt: null,
  lastViewedAt: null,
  lastAssembledAt: null,
  actions: null,
}

////////////////////////////////////////
////////// INDEX TABLE BELOW ///////////
////////////////////////////////////////

const IndexTable = () => {
  const { isCompanyAdmin } = useUser()
  const company = useCompany()
  // const { collapsed } = useLayoutContext()

  const { sharedTags, tagsLoading, narrativesLoading, narratives, refetchNarratives } =
    useContext(NarrativeIndexContext)

  const [columns, setColumns] = useState<(ColumnGroupType<any> | ColumnType<any>)[]>([])
  const [filters, setFilters] = useState<any>(DEFAULT_FILTERS)
  const prevFilters = usePrevious(filters)

  const searchInputRef = useRef<InputRef>(null)

  const tableData = makeTableData({ narratives, isCompanyAdmin, company, refetchNarratives })

  const handleOnChange = (_: unknown, filters: any) => {
    setFilters(filters)
  }

  useEffect(() => {
    // initialize columns
    if (isEmpty(columns) && !isEmpty(narratives) && !narrativesLoading && !tagsLoading) {
      const initialColumns = makeColumnsConfig({
        sharedTags,
        searchInputRef,
        filters,
      }) as ColumnsType<any>

      setColumns(initialColumns)
    }

    // update columns when filters change
    if (prevFilters && !isEqual(prevFilters, filters)) {
      const columnsWithFilters = makeColumnsConfig({
        sharedTags,
        searchInputRef,
        filters,
      }) as ColumnsType<any>

      setColumns(columnsWithFilters)
    }
  }, [narratives, narrativesLoading, tagsLoading, columns, sharedTags, prevFilters, filters])

  return <Table columns={columns as any} dataSource={tableData} onChange={handleOnChange} pagination={false} />
}

export default IndexTable
