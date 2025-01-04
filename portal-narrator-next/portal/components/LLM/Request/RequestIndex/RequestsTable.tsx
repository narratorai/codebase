import { SearchOutlined } from '@ant-design/icons'
import { InputRef } from 'antd/lib/input'
import { ColumnGroupType, ColumnType } from 'antd/lib/table'
import { Table } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import TableSearchDropdown from 'components/LLM/Training/TableSearchDropdown'
import { Typography } from 'components/shared/jawns'
import UserAvatar from 'components/shared/UserAvatar'
import { ITrainining_Request_Status_Enum, useGetCompanyUsersQuery } from 'graph/generated'
import { compact, get, map, startCase, uniq } from 'lodash'
import moment from 'moment-timezone'
import { RefObject, useRef, useState } from 'react'
import styled from 'styled-components'
import { breakpoints, colors } from 'util/constants'
import { timeFromNow } from 'util/helpers'

import { REQUEST_USER_FILTER_COUNT_LIMIT } from '../constants'
import { Requests, VisibleRequestTypes } from '../interfaces'
import AssignToUserSelect from './AssignToUserSelect'
import StatusTag from './StatusTag'

const ContextText = styled(Typography)`
  overflow-x: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 220px;

  @media only screen and (min-width: ${breakpoints.lg}) {
    max-width: 320px;
  }

  @media only screen and (width >= 1400px) {
    max-width: 400px;
  }
`

const StyledTable = styled(Table)`
  .antd5-table-row {
    &:hover {
      cursor: pointer;
    }
  }
`

interface Props {
  requests?: Requests
  handleRowClick: (id: string) => void
  visibleRequestType: VisibleRequestTypes
  refetchRequests: () => void
}

const DEFAULT_FILTERS = {
  requestor: null,
  jobTitle: null,
  context: null,
  type: null,
  status: null,
  assignedTo: null,
  createdAt: null,
}

type FilteredValue = string[] | null
type Filter = {
  text: React.ReactNode
  value: React.Key | boolean
  children?: Filter[]
}
type FilterSearch = boolean | ((input: any, record: any) => boolean)

const standardColumn = (title: string, key: string) => ({
  title,
  dataIndex: key,
  key,
})

const filterColumn = (
  title: string,
  key: string,
  filteredValue: FilteredValue,
  filters: Filter[] = [],
  filterSearch: FilterSearch = false
) => ({
  ...standardColumn(title, key),
  filteredValue,
  filters,
  filterSearch,
})

const customSearchFilterColumn = (
  title: string,
  key: string,
  filteredValue: FilteredValue,
  searchPlaceholder: string,
  searchRef: RefObject<InputRef>
) => ({
  ...filterColumn(title, key, filteredValue),
  filterIcon: (filtered: boolean) => <SearchOutlined style={{ color: filtered ? colors.blue500 : undefined }} />,
  filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
    <TableSearchDropdown
      ref={searchRef}
      setSelectedKeys={setSelectedKeys}
      selectedKeys={selectedKeys}
      confirm={confirm}
      clearFilters={clearFilters}
      placeholder={searchPlaceholder}
    />
  ),
  onFilterDropdownOpenChange: (visible: boolean) => {
    if (visible) {
      setTimeout(() => searchRef?.current?.select(), 100)
    }
  },
})

const userColumn = (
  title: string,
  key: string,
  filteredValue: FilteredValue,
  userFilterPath: string,
  users: Record<string, any>[],
  searchUserRef: RefObject<InputRef>
): ColumnGroupType<any> | ColumnType<any> => {
  const count = users.length

  const filter = {
    onFilter: (value: any, record: any) => {
      const user = get(record, userFilterPath, null)
      const email = user?.email
      const firstName = user?.company_users?.[0]?.first_name
      const lastName = user?.company_users?.[0]?.last_name

      if (typeof value !== 'string') {
        return false
      }

      return (
        email?.toLowerCase().includes(value.toLowerCase()) ||
        firstName?.toLowerCase().includes(value.toLowerCase()) ||
        lastName?.toLowerCase().includes(value.toLowerCase())
      )
    },
  }

  if (count <= REQUEST_USER_FILTER_COUNT_LIMIT) {
    return {
      ...filterColumn(
        title,
        key,
        filteredValue,
        map(users, (user) => ({ text: user.email, value: user.email }))
      ),
      ...filter,
    }
  }
  return {
    ...customSearchFilterColumn(title, key, filteredValue, 'Search by Name or Email', searchUserRef),
    ...filter,
  }
}

// eslint-disable-next-line max-lines-per-function
const useRequestsTable = (
  visibleRequestType: VisibleRequestTypes,
  refetchRequests: () => void,
  requests?: Requests
) => {
  const company = useCompany()
  const [filters, setFilters] = useState<any>(DEFAULT_FILTERS)

  const searchRequestorRef = useRef<InputRef>(null)
  const searchAssigneeRef = useRef<InputRef>(null)
  const searchContextRef = useRef<InputRef>(null)

  const { data: companyUserData } = useGetCompanyUsersQuery({
    variables: { company_slug: company?.slug },
  })
  const companyUsers = companyUserData?.company_users
  const jobTitles = uniq(compact(map(companyUsers, (companyUser) => companyUser.job_title)))
  const trainingTypes = uniq(compact(map(requests, (request) => request.type)))
  const requestors = uniq(compact(map(requests, (request) => request.user)))
  const assignees = uniq(compact(map(requests, (request) => request.assignee)))

  const showAllRequests = visibleRequestType === VisibleRequestTypes.All
  const showMyOutstandingRequests = visibleRequestType === VisibleRequestTypes.MyOutstanding
  const showStatus = showAllRequests
  const showWaiting = !showAllRequests
  const showAssigned = !showMyOutstandingRequests

  const handleOnChange = (_: unknown, filters: any) => {
    setFilters(filters)
  }

  const rows = map(requests, (request) => ({
    key: request.id,
    requestor: request.user,
    jobTitle: request.user,
    context: request.context,
    type: request.type,
    status: request.status,
    assignedTo: request,
    createdAt: {
      createdAt: request.created_at,
      timeAgo: timeFromNow(request.created_at, company.timezone),
    },
  }))

  const columns: any[] = [
    {
      ...userColumn('Submitted', 'requestor', filters['requestor'], 'requestor', requestors, searchRequestorRef),
      render: (request: any) => {
        // We expect that the requestor is always present.
        const companyUser = get(request, 'company_users.0', null)
        return <UserAvatar companyUser={companyUser} showName={false} />
      },
    },
    {
      ...filterColumn(
        'Role',
        'jobTitle',
        filters['jobTitle'],
        map(jobTitles, (jobTitle) => ({ text: jobTitle, value: jobTitle }))
      ),
      render: (user: any) => user?.company_users?.[0]?.job_title,
      onFilter: (value: any, record: any) => {
        const jobTitle = record['jobTitle']?.company_users?.[0]?.job_title
        return jobTitle === value
      },
    },
    {
      ...filterColumn(
        'Type',
        'type',
        filters['type'],
        map(trainingTypes, (type) => ({ text: type, value: type }))
      ),
      onFilter: (value: any, record: any) => record.type === value,
      render: (type: any) => type,
    },
    {
      ...customSearchFilterColumn('Context', 'context', filters['context'], 'Search by Context', searchContextRef),
      onFilter: (value: any, record: any) => {
        const context = record.context
        return context.toLowerCase().includes(value.toLowerCase())
      },
      render: (context: any) => <ContextText title={context}>{context}</ContextText>,
    },
  ]

  if (showStatus) {
    columns.push({
      ...filterColumn('Status', 'status', filters['status']),
      filters: [
        { text: startCase(ITrainining_Request_Status_Enum.New), value: ITrainining_Request_Status_Enum.New },
        {
          text: startCase(ITrainining_Request_Status_Enum.Skipped),
          value: ITrainining_Request_Status_Enum.Skipped,
        },
        {
          text: startCase(ITrainining_Request_Status_Enum.Completed),
          value: ITrainining_Request_Status_Enum.Completed,
        },
      ],
      onFilter: (value: any, record: any) => record.status === value,
      render: (status: any) => <StatusTag status={status} />,
    })
  }

  if (showAssigned) {
    columns.push({
      ...userColumn(
        'Assigned',
        'assignedTo',
        filters['assignedTo'],
        'assignee.assignedTo',
        assignees,
        searchAssigneeRef
      ),
      render: (request: any) => {
        // We expect that the requestor is always present.
        const companyUser = get(request, 'assignee.company_users.0', null)
        if (!companyUser) return <AssignToUserSelect request={request} refetchRequests={refetchRequests} />

        return <UserAvatar companyUser={companyUser} showName />
      },
    })
  }

  if (showWaiting) {
    columns.push({
      ...standardColumn('Waiting', 'createdAt'),
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
    })
  }

  return { columns, rows, handleOnChange }
}

const RequestsTable = ({ requests, handleRowClick, visibleRequestType, refetchRequests }: Props) => {
  const { columns, rows, handleOnChange } = useRequestsTable(visibleRequestType, refetchRequests, requests)

  return (
    <StyledTable
      columns={columns as any}
      dataSource={rows}
      onChange={handleOnChange}
      pagination={false}
      onRow={(record) => {
        return {
          onClick: () => {
            handleRowClick(record.key)
          },
        }
      }}
    />
  )
}

export default RequestsTable
