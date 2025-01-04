import { DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { ColumnGroupType, ColumnsType, ColumnType } from 'antd/lib/table/interface'
import { Table } from 'antd-next'
import type { InputRef } from 'antd-next/es/input'
import { useCompany } from 'components/context/company/hooks'
import { TrainingsType, TrainingType } from 'components/LLM/Training/interfaces'
import UserQuestionCell from 'components/LLM/Training/UserQuestionCell'
import { Box, Typography } from 'components/shared/jawns'
import UserAvatar from 'components/shared/UserAvatar'
import { ICompany } from 'graph/generated'
import { isEmpty, isEqual, map, some } from 'lodash'
import moment from 'moment-timezone'
import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { colors } from 'util/constants'
import { timeFromNow } from 'util/helpers'
import usePrevious from 'util/usePrevious'

import TableSearchDropdown from './TableSearchDropdown'

const StyledTable = styled(Table)`
  .antd5-table-row {
    &:hover {
      cursor: pointer;
    }
  }
`

const DEFAULT_FILTERS = {
  createdBy: null,
  dataQuestion: null,
  userQuestions: null,
  stream: null,
  production: null,
  actions: null,
}

interface MakeTableDataProps {
  trainings?: TrainingsType
  company: ICompany
}

const makeTableData = ({ trainings, company }: MakeTableDataProps) => {
  return trainings?.map((training) => ({
    key: training.id,
    createdBy: training.user,
    createdAt: {
      createdAt: training.created_at,
      timeAgo: timeFromNow(training.created_at, company.timezone),
    },
    dataQuestion: training.question,
    userQuestions: training,
    stream: training.company_table.identifier || training.company_table.activity_stream,
    production: !!training.in_production,
    actions: training,
  }))
}

interface MakeColumnsConfigProps {
  filters?: Record<string, string[] | null>
  handleOpenDeleteModal: (training: TrainingType) => void
  searchCreatedByRef: React.RefObject<InputRef>
  searchDataQuestionRef: React.RefObject<InputRef>
  searchUserQuestionRef: React.RefObject<InputRef>
  company: ICompany
}

const makeColumnsConfig = ({
  filters = DEFAULT_FILTERS,
  handleOpenDeleteModal,
  searchCreatedByRef,
  searchDataQuestionRef,
  searchUserQuestionRef,
  company,
}: MakeColumnsConfigProps): ColumnsType<any> => {
  // antd wants filteredValue passed to all columns if any have a filter
  const defaultFilteredValue = isEmpty(filters) ? [] : null

  const columns: ColumnsType<any> = [
    {
      title: 'Created By',
      dataIndex: 'createdBy',
      key: 'createdBy',
      filteredValue: filters['createdBy'] || defaultFilteredValue,
      filterIcon: (filtered: boolean) => <SearchOutlined style={{ color: filtered ? colors.blue500 : undefined }} />,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <TableSearchDropdown
          ref={searchCreatedByRef}
          setSelectedKeys={setSelectedKeys}
          selectedKeys={selectedKeys}
          confirm={confirm}
          clearFilters={clearFilters}
          placeholder="Search by Name or Email"
        />
      ),
      onFilterDropdownOpenChange: (visible: boolean) => {
        if (visible) {
          // when they open up the search
          // let them start typing (don't need to click into the search to start)
          setTimeout(() => searchCreatedByRef?.current?.select(), 100)
        }
      },
      onFilter: (value, record) => {
        const user = record['createdBy']
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
      render: (user) => <UserAvatar user={user} showName={false} />,
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      filteredValue: filters['createdAt'] || defaultFilteredValue,
      onFilter: (value, record) => record.createdBy === value,
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
    },
    {
      title: 'Data Question',
      dataIndex: 'dataQuestion',
      key: 'dataQuestion',
      filteredValue: filters['dataQuestion'] || defaultFilteredValue,
      filterIcon: (filtered: boolean) => <SearchOutlined style={{ color: filtered ? colors.blue500 : undefined }} />,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <TableSearchDropdown
          ref={searchDataQuestionRef}
          setSelectedKeys={setSelectedKeys}
          selectedKeys={selectedKeys}
          confirm={confirm}
          clearFilters={clearFilters}
          placeholder="Search by Data Questions"
        />
      ),
      onFilterDropdownOpenChange: (visible: boolean) => {
        if (visible) {
          // when they open up the search
          // let them start typing (don't need to click into the search to start)
          setTimeout(() => searchDataQuestionRef?.current?.select(), 100)
        }
      },
      onFilter: (value, record) => {
        const question = record['dataQuestion']

        if (typeof value !== 'string') {
          return false
        }

        return question?.toLowerCase().includes(value.toLowerCase())
      },
      render: (dataQuestion) => <Typography style={{ maxWidth: '320px' }}>{dataQuestion}</Typography>,
    },
    {
      title: 'User Questions',
      dataIndex: 'userQuestions',
      key: 'userQuestions',
      filteredValue: filters['userQuestions'] || defaultFilteredValue,
      filterIcon: (filtered: boolean) => <SearchOutlined style={{ color: filtered ? colors.blue500 : undefined }} />,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <TableSearchDropdown
          ref={searchUserQuestionRef}
          setSelectedKeys={setSelectedKeys}
          selectedKeys={selectedKeys}
          confirm={confirm}
          clearFilters={clearFilters}
          placeholder="Search by User Questions"
        />
      ),
      onFilterDropdownOpenChange: (visible: boolean) => {
        if (visible) {
          // when they open up the search
          // let them start typing (don't need to click into the search to start)
          setTimeout(() => searchUserQuestionRef?.current?.select(), 100)
        }
      },
      onFilter: (value, record) => {
        const training = record['userQuestions']
        const userQuestions = map(training?.user_training_questions, (userQuestion) => userQuestion.question)

        if (typeof value !== 'string') {
          return false
        }

        return some(userQuestions, (question) => question.toLowerCase().includes(value.toLowerCase()))
      },
      render: (training) => <UserQuestionCell training={training} />,
    },
    {
      title: 'Stream',
      dataIndex: 'stream',
      key: 'stream',
      filteredValue: filters['stream'] || defaultFilteredValue,
      onFilter: (value, record) => {
        const stream = record['stream']

        return stream === value
      },
      render: (stream) => <Typography>{stream}</Typography>,
      filters: map(company.tables, (table) => ({
        text: table.identifier || table.activity_stream,
        value: table.identifier || table.activity_stream,
      })),
    },
    {
      title: 'In Production',
      dataIndex: 'production',
      key: 'production',
      filters: [
        {
          text: 'Yes',
          value: true,
        },
        {
          text: 'No',
          value: false,
        },
      ],
      filteredValue: filters['production'] || defaultFilteredValue,
      onFilter: (value, record) => record.production === value,
      render: (inProduction) => <Typography>{inProduction ? 'Yes' : null}</Typography>,
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      key: 'actions',
      render: (training) => (
        <Box>
          <DeleteOutlined
            style={{ color: colors.red500 }}
            onClick={(e) => {
              e.stopPropagation()
              handleOpenDeleteModal(training)
            }}
          />
        </Box>
      ),
    },
  ]

  return columns
}

interface Props {
  trainings?: TrainingsType
  handleOpenDeleteModal: (training: TrainingType) => void
  handleOpenEditDrawer: (id: string) => void
}

const TrainingIndexTable = ({ trainings, handleOpenDeleteModal, handleOpenEditDrawer }: Props) => {
  const [columns, setColumns] = useState<(ColumnGroupType<any> | ColumnType<any>)[]>([])
  const [filters, setFilters] = useState<any>(DEFAULT_FILTERS)
  const prevFilters = usePrevious(filters)
  const company = useCompany()

  const tableData = makeTableData({ trainings, company })
  const searchCreatedByRef = useRef<InputRef>(null)
  const searchDataQuestionRef = useRef<InputRef>(null)
  const searchUserQuestionRef = useRef<InputRef>(null)

  const handleOnChange = (_: unknown, filters: any) => {
    setFilters(filters)
  }

  useEffect(() => {
    // initialize columns
    if (isEmpty(columns) && !isEmpty(trainings)) {
      const initialColumns = makeColumnsConfig({
        filters,
        handleOpenDeleteModal,
        searchCreatedByRef,
        searchDataQuestionRef,
        searchUserQuestionRef,
        company,
      }) as ColumnsType<any>

      setColumns(initialColumns)
    }

    // update columns when filters change
    if (prevFilters && !isEqual(prevFilters, filters)) {
      const columnsWithFilters = makeColumnsConfig({
        filters,
        handleOpenDeleteModal,
        searchCreatedByRef,
        searchDataQuestionRef,
        searchUserQuestionRef,
        company,
      }) as ColumnsType<any>

      setColumns(columnsWithFilters)
    }
  }, [trainings, columns, prevFilters, filters, company, handleOpenDeleteModal])

  return (
    <StyledTable
      columns={columns as any}
      dataSource={tableData}
      onChange={handleOnChange}
      pagination={false}
      onRow={(record) => {
        return {
          onClick: () => {
            handleOpenEditDrawer(record.key)
          },
        }
      }}
    />
  )
}

export default TrainingIndexTable
