import { CloseCircleFilled } from '@ant-design/icons'
import { AutoComplete, Input, Progress } from 'antd-next'
import { FormItem } from 'components/antd/staged'
import { useCompany } from 'components/context/company/hooks'
import { find, isEmpty, map } from 'lodash'
import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { colors } from 'util/constants'
import { useLazyCallMavis } from 'util/useCallMavis'
import usePrevious from 'util/usePrevious'

const Container = styled.div`
  position: relative;

  .antd5-input-affix-wrapper {
    border-radius: 100px;
  }
`
interface CustomerOption {
  customer: string // email
  customer_display_name: string | null
}

interface CustomerSearchResponse {
  customer_options: CustomerOption[]
}

interface Props {
  activityStream: string
  customerFromUrl?: string
  onSelectCustomer: (customer: string) => void
}

const CustomerSearchSelect = ({ activityStream, customerFromUrl = '', onSelectCustomer }: Props) => {
  const company = useCompany()
  const prevCustomerFromUrl = usePrevious(customerFromUrl)

  const [inputValue, setInputValue] = useState(customerFromUrl)
  const [dropdownOpened, setDropdownOpened] = useState(false)

  const selectedTable = find(company.tables, ['activity_stream', activityStream])
  const tableId = selectedTable?.id
  const customerDim = selectedTable?.customer_dim
  const hasCustomerDim = !!customerDim?.id

  const [
    getAutoCompleteCustomer,
    { response: possibleCustomers, loading: autoCompleteLoading, reset: resetAutoComplete },
  ] = useLazyCallMavis<CustomerSearchResponse>({
    method: 'GET',
    path: `/v2/customer_journey/${tableId}/search`,
  })

  const prevAutoCompleteLoading = usePrevious(autoCompleteLoading)
  const autoCompleteOptions = map(possibleCustomers?.customer_options, (customer) => {
    const displayName = customer.customer_display_name
    const email = customer.customer

    if (displayName) {
      return {
        value: email,
        label: `${displayName} (${email})`,
      }
    }

    return {
      value: email,
    }
  })

  const handleGetAutoCompleteOptions = (input?: string) => {
    const hasInput = input || inputValue

    // if we have a customer dim and input, get the autocomplete options
    if (hasCustomerDim && hasInput) {
      getAutoCompleteCustomer({
        params: {
          search_term: input || inputValue,
        },
      })
    }

    // if we don't have a customer dim, go to the customer page
    if (!hasCustomerDim && hasInput) {
      onSelectCustomer(hasInput)
    }
  }

  // update input value when customerFromUrl changes
  useEffect(() => {
    if (customerFromUrl !== prevCustomerFromUrl && customerFromUrl !== inputValue) {
      setInputValue(customerFromUrl)
    }
  }, [prevCustomerFromUrl, customerFromUrl, inputValue])

  // Ensure dropdown is visible when autocomplete is done loading
  useEffect(() => {
    if (prevAutoCompleteLoading && !autoCompleteLoading && !isEmpty(possibleCustomers) && !dropdownOpened) {
      setDropdownOpened(true)
    }
  }, [prevAutoCompleteLoading, autoCompleteLoading, dropdownOpened, possibleCustomers])

  const handleClear = () => {
    resetAutoComplete()
    setInputValue('')
  }

  return (
    <Container>
      <FormItem layout="vertical" compact>
        <AutoComplete
          data-test="select-customer-input"
          autoFocus
          options={autoCompleteOptions}
          style={{ flex: 1 }}
          popupMatchSelectWidth={false}
          onSelect={(value: string) => {
            setInputValue(value)
            onSelectCustomer(value)
          }}
          onDropdownVisibleChange={setDropdownOpened}
          open={dropdownOpened}
          value={inputValue}
          onChange={setInputValue}
        >
          <Input
            placeholder={`Search ${selectedTable?.identifier}`}
            suffix={
              !autoCompleteLoading &&
              !isEmpty(inputValue) && (
                <CloseCircleFilled
                  style={{ color: colors.gray500 }}
                  onClick={() => {
                    handleClear()
                  }}
                />
              )
            }
            spellCheck={false}
            onPressEnter={() => handleGetAutoCompleteOptions()}
          />
        </AutoComplete>
      </FormItem>

      {autoCompleteLoading && (
        <div style={{ position: 'absolute', width: '75%', top: '28px' }}>
          <Progress percent={30} status="active" format={() => 'Searching for customers'} />
        </div>
      )}
    </Container>
  )
}

export default CustomerSearchSelect
