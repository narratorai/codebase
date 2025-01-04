/* eslint-disable max-lines-per-function */
import { DeleteOutlined, SearchOutlined, SwapOutlined } from '@ant-design/icons'
import type { InputRef } from 'antd/lib/input'
import type { ColumnsType } from 'antd/lib/table'
import { App, Button, Input, Space, Spin, Table, Tooltip } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { Box, Flex } from 'components/shared/jawns'
import {
  ICompany_User_Role_Enum,
  ICompanyUserFieldsFragment,
  IUpdateCompanyUserMutation,
  useGetCompanyUsersQuery,
  useUpdateCompanyUserMutation,
} from 'graph/generated'
import { compact, find, includes, isEqual, map, some, startCase, uniq } from 'lodash'
import moment from 'moment-timezone'
import { useRef, useState } from 'react'
import styled from 'styled-components'
import analytics from 'util/analytics'
import { colors } from 'util/constants'

import EditableCell from './EditableCell'
import EditableRow from './EditableRow'
import { DataRow, Record } from './interfaces'
import ResendInvitationButton from './ResendInvitationButton'

type Column = ColumnsType<any>[number]

type EditableFieldKeys = keyof Pick<
  ICompanyUserFieldsFragment,
  'first_name' | 'last_name' | 'phone' | 'job_title' | 'role'
>

const EDITABLE_FIELDS: EditableFieldKeys[] = ['first_name', 'last_name', 'phone', 'job_title', 'role']

const StlyedDeleteIcon = styled(DeleteOutlined)`
  &:hover {
    color: ${colors.red500};
    cursor: pointer;
  }
`

interface Props {
  onDelete: (id: string) => void
  onTransfer: (id: string) => void
}

const CompanyUsersTable = ({ onDelete, onTransfer }: Props) => {
  const { notification } = App.useApp()
  const { isCompanyAdmin, companyUser } = useUser()
  const company = useCompany()
  const searchInputRef = useRef<InputRef>(null)

  const { data: companyUserData, loading: loadingUsers } = useGetCompanyUsersQuery({
    variables: { company_slug: company?.slug },
  })
  const companyUsers = companyUserData?.company_users

  // companyUserBeforeUpdate helps diff the update user response for tracking
  const [companyUserBeforeUpdate, setCompanyUserBeforeUpdate] = useState<
    { __typename?: 'company_user' | undefined; id: any } & ICompanyUserFieldsFragment
  >()

  // handles: tracking and success notification
  const handleUpdateUserSuccess = (data: IUpdateCompanyUserMutation) => {
    const companyUserResponse = data.update_company_user?.returning[0]

    // Basic tracking data
    let trackingData: {
      company_user_requesting_change: string
      company_user_updated: string
      field_updated?: string
      to_role?: string | null
    } = {
      company_user_requesting_change: companyUser?.id,
      company_user_updated: companyUserResponse?.id,
    }

    // enrich tracking data with diff from companyUser before update
    if (companyUserBeforeUpdate) {
      some(EDITABLE_FIELDS, (field) => {
        const prevValue = companyUserBeforeUpdate[field]
        const newValue = companyUserResponse && companyUserResponse[field]
        // if the value has been updated
        // add it to tracking
        if (!isEqual(prevValue, newValue)) {
          trackingData = {
            ...trackingData,
            field_updated: field,
          }

          // if the role was updated, include what it was updated to
          if (field === 'role') {
            trackingData = {
              ...trackingData,
              to_role: newValue,
            }
          }

          // escape some since you can only upate one at a time
          return
        }
      })
    }

    analytics.track('updated_company_user', trackingData)

    notification.success({
      key: 'update-user-success',
      message: 'Changes Saved',
      placement: 'topRight',
    })
  }

  const handleUpdateUserError = () => {
    notification.error({
      key: 'update-user-error',
      message: 'Error Updating User',
      placement: 'topRight',
    })
  }

  const [updateUser] = useUpdateCompanyUserMutation({
    onCompleted: handleUpdateUserSuccess,
    onError: handleUpdateUserError,
  })

  const handleSave = (row: DataRow) => {
    const { first_name, last_name, phone, job_title, role } = row
    const userId = row.key

    const companyUser = find(companyUsers, ['id', userId])
    setCompanyUserBeforeUpdate(companyUser)

    const data = {
      id: userId,
      first_name,
      last_name,
      phone,
      job_title: job_title?.jobTitle,
      role,
    }

    if (companyUser) {
      updateUser({
        variables: data,
        // this makes the updates show immediately
        // so it doesn't flash to previous values
        // note: mutation in graphql file needs to return
        // everything the list query needs (i.e. first_name, last_name, phone....)
        // https://www.apollographql.com/docs/react/performance/optimistic-ui/
        optimisticResponse: {
          update_company_user: {
            __typename: 'company_user_mutation_response',
            affected_rows: 1,
            returning: [
              {
                __typename: 'company_user',
                company_id: company.id,
                user_id: userId,
                user: {
                  id: companyUser.user.id,
                  role: companyUser.user.role,
                  email: companyUser.user.email,
                },
                updated_at: Date.now(),
                ...data,
              },
            ],
          },
        },
      })
    }
  }

  const getColumnSearchProps = (
    key: string
  ): Pick<Column, 'filterDropdown' | 'filterIcon' | 'onFilter' | 'onFilterDropdownOpenChange' | 'render'> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }} data-test="search-dropdown-container">
        <Input
          ref={searchInputRef}
          placeholder={`Search ${startCase(key)}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={(e) => {
            e.stopPropagation()
            confirm()
          }}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            data-test="search-button"
            type="primary"
            onClick={() => confirm()}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
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
      <SearchOutlined style={{ color: filtered ? colors.blue500 : undefined }} data-test={`search-icon-${key}`} />
    ),
    onFilter: (value, record) =>
      record[key] ? record[key].toString().toLowerCase().includes(value.toString().toLowerCase()) : '',
    onFilterDropdownOpenChange: (visible: boolean) => {
      if (visible) {
        // when they open up the search
        // let them start typing (don't need to click into the search to start)
        setTimeout(() => searchInputRef?.current?.select(), 100)
      }
    },
    render: (text: string) => text,
  })

  const columns = compact([
    {
      title: 'First Name',
      dataIndex: 'first_name',
      key: 'first_name',
      // sorter alphabetical: https://github.com/ant-design/ant-design/issues/1792#issuecomment-322660280
      sorter: (a: any, b: any) => a?.first_name?.localeCompare(b?.first_name),
      handleSave,
      editable: isCompanyAdmin && includes(EDITABLE_FIELDS, 'first_name'),
      ...getColumnSearchProps('first_name'),
    },
    {
      title: 'Last Name',
      dataIndex: 'last_name',
      key: 'last_name',
      sorter: (a: any, b: any) => a?.last_name?.localeCompare(b?.last_name),
      handleSave,
      editable: isCompanyAdmin && includes(EDITABLE_FIELDS, 'last_name'),
      ...getColumnSearchProps('last_name'),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      sorter: (a: any, b: any) => a?.phone - b?.phone,
      handleSave,
      editable: isCompanyAdmin && includes(EDITABLE_FIELDS, 'phone'),
      ...getColumnSearchProps('phone'),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      defaultSortOrder: 'ascend' as const,
      sorter: (a: any, b: any) => a?.email?.localeCompare(b?.email),
      handleSave,
      // can NOT update email
      editable: false,
      ...getColumnSearchProps('email'),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      filters: [
        { text: 'Member', value: ICompany_User_Role_Enum.User },
        { text: 'Admin', value: ICompany_User_Role_Enum.Admin },
      ],
      onFilter: (value: string, record: DataRow) => record.role.includes(value),
      sorter: (a: any, b: any) => a?.role?.localeCompare(b?.role),
      handleSave,
      editable: isCompanyAdmin && includes(EDITABLE_FIELDS, 'role'),
    },
    {
      title: 'Job Title',
      dataIndex: 'job_title',
      key: 'job_title',
      sorter: (a: any, b: any) => {
        const aTitle = a?.job_title?.jobTitle || ''
        const bTitle = b?.job_title?.jobTitle || ''
        return aTitle?.localeCompare(bTitle)
      },
      handleSave,
      editable: isCompanyAdmin && includes(EDITABLE_FIELDS, 'job_title'),
      ...getColumnSearchProps('job_title'),
    },
    {
      title: 'Updated At',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (time: string) => {
        const formattedUpdatedAt = `Updated ${moment.utc(time).fromNow()}`
        return formattedUpdatedAt
      },
      sorter: (a: any, b: any) => moment.utc(a?.updated_at).unix() - moment.utc(b?.updated_at).unix(),
    },
    isCompanyAdmin && {
      title: 'Options',
      dataIndex: 'options',
      key: 'options',
      render: ({ id, email }: { id: string; email: string }) => {
        return (
          <Flex justifyContent="space-around">
            <Tooltip title="Delete User">
              <Button
                icon={<StlyedDeleteIcon />}
                data-test="delete-user-icon"
                size="small"
                type="text"
                onClick={() => {
                  onDelete(id)
                }}
              />
            </Tooltip>

            <Tooltip title="Transfer User's Resources" placement="topLeft">
              <Button icon={<SwapOutlined />} type="text" size="small" onClick={() => onTransfer(id)} />
            </Tooltip>

            {!!company?.datacenter_region && <ResendInvitationButton email={email} />}
          </Flex>
        )
      },
    },
  ])

  const editableColumns: Partial<DataRow>[] = columns.map((col) => {
    if (!col.editable) {
      return col
    }

    return {
      ...col,
      onCell: (record: DataRow) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave,
      }),
    }
  })

  const allJobTitles = uniq(compact(map(companyUsers, (companyUser) => companyUser.job_title)))

  const data = map(companyUsers, (companyUser) => ({
    key: companyUser.id,
    first_name: companyUser.first_name,
    last_name: companyUser.last_name,
    phone: companyUser.phone,
    email: companyUser.user?.email,
    job_title: { jobTitle: companyUser.job_title, allJobTitles },
    role: companyUser.role,
    updated_at: companyUser.updated_at,
    options: { id: companyUser.id, email: companyUser.user?.email },
  })) as readonly Record[] | undefined

  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  }

  return (
    <Box mt={4} style={{ overflowX: 'auto' }}>
      <Spin spinning={loadingUsers}>
        <Table columns={editableColumns} dataSource={data} components={components} pagination={{ pageSize: 100 }} />
      </Spin>
    </Box>
  )
}

export default CompanyUsersTable
