import { Alert, Skeleton } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { Box, Link, Typography } from 'components/shared/jawns'
import { ICompany_Table } from 'graph/generated'
import { find, get, includes, isEmpty, keys, map, startCase, startsWith } from 'lodash'
import queryString from 'query-string'
import React, { useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { colors, semiBoldWeight } from 'util/constants'

import { getLogger } from '@/util/logger'

import useGetCustomerProfile from './services/useGetCustomerProfile'
import TableWithRows from './TableWithRows'
const logger = getLogger()

interface IAttributesListItem {
  label: string
  value: string
}

interface Props {
  customer: string
  sidebarTable?: string
  shouldRefetch?: boolean
  onRefetchSuccess?: () => void
}

const WordWrapTypography = styled(Typography)`
  word-wrap: break-word;
`

const WordWrapLink = styled(Link)`
  word-wrap: break-word;
`

const makeAttributesListItem = ({ label, value }: IAttributesListItem) => {
  let ValueComponent = <WordWrapTypography>{value}</WordWrapTypography>

  if (startsWith(value, 'https://')) {
    ValueComponent = (
      <WordWrapLink target="_blank" rel="noopener noreferrer" href={value}>
        {value}
      </WordWrapLink>
    )
  }

  return { label: startCase(label), value: ValueComponent }
}

const CustomerProfile = ({ customer, sidebarTable, shouldRefetch, onRefetchSuccess }: Props) => {
  const company = useCompany()
  const history = useHistory()
  const { table } = useParams<{ table: string }>()
  const queryParams = queryString.parse(history.location.search)
  const { customer_kind } = queryParams

  const tableConfig = (find(company.tables, ['activity_stream', table || sidebarTable]) || {}) as ICompany_Table

  // fetch customer profile
  const {
    data: customerProfile,
    loading: customerProfileLoading,
    error: customerProfileError,
    refetch: refetchCustomerProfile,
  } = useGetCustomerProfile({ customer, table: tableConfig?.customer_dim_table_id })

  // handle refetch customer profile
  useEffect(() => {
    const handleRefetch = async () => {
      try {
        await refetchCustomerProfile({ runLive: true })
        onRefetchSuccess && onRefetchSuccess()
      } catch (error) {
        logger.error(error)
      }
    }

    if (shouldRefetch && !customerProfileLoading && !customerProfileError) {
      handleRefetch()
    }
  }, [shouldRefetch, onRefetchSuccess, customerProfileLoading, customerProfileError])

  // First row only for customer data
  const customerData = get(customerProfile, `data.rows`, [])[0]
  const customerDataKeys = keys(customerData)
  const items = map(customerDataKeys, (key) => makeAttributesListItem({ label: key, value: customerData[key] }))

  return (
    <Box>
      {customer_kind === 'source_id' && (
        <Box mb={1}>
          <Alert type="warning" message="Customer derived from Source Id" />
        </Box>
      )}

      <Box mb={2} pb={1} style={{ borderBottom: `1px solid ${colors.gray300}` }}>
        <Typography data-test="customer-email-title" type="title400" fontWeight={semiBoldWeight}>
          {customer}
        </Typography>
      </Box>

      {customerProfileError && !includes(customerProfileError.message, 'No Customer Table') && (
        <Box my={2}>
          <Alert type="error" message={customerProfileError.message} />
        </Box>
      )}

      <Skeleton loading={customerProfileLoading} active>
        {isEmpty(tableConfig?.customer_dim_table_id) && (
          <Typography type="title400" mb={1}>
            No customer table available. Please create one in{' '}
            <Link unstyled to="/transformations">
              Transformations
            </Link>
          </Typography>
        )}

        {isEmpty(items) ? (
          <Typography type="title400">No customer information was found.</Typography>
        ) : (
          <TableWithRows items={items} />
        )}
      </Skeleton>
    </Box>
  )
}

export default CustomerProfile
