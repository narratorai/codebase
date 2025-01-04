import { Select, Spin } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { ICompany_User_Role_Enum, useGetCompanyUsersQuery } from 'graph/generated'
import { filter, map } from 'lodash'
import { useEffect } from 'react'
import styled from 'styled-components'
import { colors } from 'util/constants'
import { useLazyCallMavis } from 'util/useCallMavis'
import usePrevious from 'util/usePrevious'

import { getLogger } from '@/util/logger'

import { Request } from '../interfaces'
const logger = getLogger()

const SearchWrapper = styled.div`
  .antd5-select-selector {
    border: none !important;
    background-color: transparent !important;
  }

  .antd5-select-selection-placeholder {
    color: ${colors.mavis_dark_purple};
    font-weight: 600;
  }
`
interface Props {
  request: Request
  refetchRequests: () => void
}

const AssignToUserSelect = ({ request, refetchRequests }: Props) => {
  const company = useCompany()
  const { data: companyUsers, loading: companyUsersLoading } = useGetCompanyUsersQuery({
    variables: { company_slug: company.slug },
  })

  // only show admins in the options
  const adminCompanyUsers = filter(
    companyUsers?.company_users,
    (companyUser) => companyUser?.role === ICompany_User_Role_Enum.Admin
  )

  const options = map(adminCompanyUsers, (companyUser) => ({
    label: companyUser.user.email,
    value: companyUser.user.id,
  }))

  const [updateRequest, { loading: updateLoading, error: updateError }] = useLazyCallMavis<any>({
    method: 'PATCH',
    path: `/v1/llm/request/r/${request.id}`,
  })
  const prevUpdateLoading = usePrevious(updateLoading)

  // refetch requests on successful update
  useEffect(() => {
    if (prevUpdateLoading && !updateLoading && !updateError) {
      refetchRequests()
    }
  }, [prevUpdateLoading, updateLoading, updateError, refetchRequests])

  // TODO: what endpoint do we hit for updates?
  const onSelect = (userId: string) => {
    logger.info({ userId, request }, 'What endpoint do I hit to update this request assignee?')
    updateRequest({
      body: {
        assigned_to: userId,
        status: request.status,
      },
    })
  }

  // prevent the click event from bubbling up to the parent
  // so we don't navigate to the request edit page
  const handleStopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div onClick={handleStopPropagation}>
      <Spin spinning={companyUsersLoading || updateLoading}>
        <SearchWrapper>
          <Select
            options={options}
            onSelect={onSelect}
            placeholder="Assign"
            popupMatchSelectWidth={false}
            style={{ minWidth: 120 }}
          />
        </SearchWrapper>
      </Spin>
    </div>
  )
}

export default AssignToUserSelect
