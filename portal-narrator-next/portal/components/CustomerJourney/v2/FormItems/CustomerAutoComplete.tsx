import { CloseCircleFilled, LoadingOutlined } from '@ant-design/icons'
import { AutoComplete, Input } from 'antd-next'
import { FormItem } from 'components/antd/staged'
import { useCompany } from 'components/context/company/hooks'
import { get, isEmpty, map } from 'lodash'
import { useEffect, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { colors } from 'util/constants'
import usePrevious from 'util/usePrevious'

import { getLogger } from '@/util/logger'

import { CUSTOMER_KIND_ANONYMOUS_ID, CUSTOMER_KIND_CUSTOMER, CUSTOMER_KIND_JOIN_CUSTOMER } from '../services/constants'
import useGetAutoCompleteCustomer from '../services/useGetAutoCompleteCustomer'

const logger = getLogger()

const inputIconStyles = {
  color: colors.gray500,
}

export const getLabel = (customerKindValue: string) => {
  if (customerKindValue === CUSTOMER_KIND_CUSTOMER) {
    return 'Customer'
  }

  if (customerKindValue === CUSTOMER_KIND_ANONYMOUS_ID) {
    return 'Anonymous Id'
  }

  if (customerKindValue === CUSTOMER_KIND_JOIN_CUSTOMER) {
    return 'Join Customer'
  }

  // default to Customer
  return 'Customer'
}

const CustomerAutoComplete = () => {
  const company = useCompany()

  const { control, watch } = useFormContext()

  const [dropdownOpened, setDropdownOpened] = useState(false)

  const selectedTableValue = watch('table')
  const customerKindValue = watch('customer_kind')
  const customerSearchValue = watch('customer')

  const selectedTable = company.tables.find((table) => table.activity_stream === selectedTableValue)
  const hasCustomerDim = !!selectedTable?.customer_dim?.id

  const customerTable = get(selectedTable, 'activity_stream')
  const prevCustomerTable = usePrevious(customerTable)

  const [
    getAutoCompleteCustomer,
    { data: possibleCustomers, loading: autoCompleteLoading, reset: resetAutoComplete, cancel: cancelAutoComplete },
  ] = useGetAutoCompleteCustomer()
  const prevAutoCompleteLoading = usePrevious(autoCompleteLoading)

  const handleClear = () => {
    logger.debug('Clearing autocomplete state')
    resetAutoComplete()
  }

  // Ensure dropdown is visible when autocomplete is done loading
  useEffect(() => {
    if (prevAutoCompleteLoading && !autoCompleteLoading && !isEmpty(possibleCustomers) && !dropdownOpened) {
      setDropdownOpened(true)
    }
  }, [prevAutoCompleteLoading, autoCompleteLoading, dropdownOpened, possibleCustomers])

  const autoCompleteOptions = isEmpty(possibleCustomers?.customers)
    ? []
    : map(possibleCustomers?.customers, (customer) => ({ value: customer }))

  useEffect(() => {
    // Reset autocomplete state whenever the customer table is changed
    if (customerTable !== prevCustomerTable) {
      handleClear()
    }
  }, [customerTable, prevCustomerTable, handleClear])

  const label = getLabel(customerKindValue)

  const handleGetAutoCompleteOptions = () => {
    if (selectedTable?.customer_dim?.id) {
      // cancel previous requests if still inflight
      if (autoCompleteLoading) {
        logger.debug('Canceling previous autocomplete request')
        cancelAutoComplete()
      }

      // Do the autocomplete request
      logger.debug('Making autocomplete request')
      getAutoCompleteCustomer({ inputValue: customerSearchValue, dimTable: selectedTable.customer_dim.id })
    }
  }

  return (
    <Controller
      control={control}
      name="customer"
      render={({ field, fieldState: { isTouched, error, isDirty } }) => (
        <FormItem
          label={label}
          layout="vertical"
          compact
          meta={{ touched: isTouched, error: error?.message }}
          extra={
            isDirty && hasCustomerDim
              ? `Hit Enter: Search ${selectedTable?.customer_dim?.schema}.${selectedTable?.customer_dim?.table} for %${customerSearchValue}%`
              : undefined
          }
        >
          <AutoComplete
            {...field}
            data-test="select-customer-input"
            autoFocus
            options={autoCompleteOptions}
            style={{ flex: 1 }}
            popupMatchSelectWidth={false}
            onSelect={(value: string) => {
              field.onChange(value)
            }}
            onDropdownVisibleChange={setDropdownOpened}
            open={dropdownOpened}
          >
            <Input
              placeholder={`Enter ${label}`}
              suffix={
                <>
                  {autoCompleteLoading && <LoadingOutlined style={inputIconStyles} spin />}

                  {!autoCompleteLoading && !isEmpty(field.value) && (
                    <CloseCircleFilled
                      style={inputIconStyles}
                      onClick={() => {
                        field.onChange('')
                        handleClear()
                      }}
                    />
                  )}
                </>
              }
              spellCheck={false}
              onPressEnter={handleGetAutoCompleteOptions}
            />
          </AutoComplete>
        </FormItem>
      )}
    />
  )
}

export default CustomerAutoComplete
