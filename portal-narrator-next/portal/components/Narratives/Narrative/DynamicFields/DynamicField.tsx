import { Input, InputNumber } from 'antd-next'
import CompanyTimezoneDatePicker from 'components/antd/CompanyTimezoneDatePicker'
import { FormItem, SearchSelect } from 'components/antd/staged'
import { Flex, Typography } from 'components/shared/jawns'
import WithinTimeSelect from 'components/shared/WithinTimeSelect'
import { includes, isEmpty, isFinite, isString, map, startCase, toString } from 'lodash'
import moment from 'moment-timezone'
import { Controller, useFormContext } from 'react-hook-form'
import { required } from 'util/forms'
import { commaify } from 'util/helpers'

const MULTI_SELECT = 'multi_select'
const TABLE_VARIABLE_MULTI = 'table_variable_multi'

export const MULTIPLE_DROPDOWN_TYPES = [MULTI_SELECT, TABLE_VARIABLE_MULTI]
const DROPDOWN_TYPES = ['list', 'table_variable', TABLE_VARIABLE_MULTI, MULTI_SELECT]

const NUMBER_RANGE = 'number_range'
const TIME_RANGE = 'time_range'

const DATE_TYPE = 'date'
const TEXT_TYPE = 'text'
const NUMBER_TYPE = 'number'
const PERCENT_TYPE = 'percent'
const REVENUE_TYPE = 'revenue'

const formatNumber = (value?: string | number) => {
  let updatedValue = value

  // convert numbers to string
  if (isFinite(value)) {
    updatedValue = toString(value)
  }

  // commaify stringified numbers
  if (isString(updatedValue) && !isEmpty(updatedValue)) {
    return commaify(updatedValue)
  }

  // otherwise it's probably null/undefined
  return updatedValue
}

interface Props {
  fieldName: string
}

const DynamicField = ({ fieldName }: Props) => {
  const { control, watch } = useFormContext()

  const fieldValues = watch(fieldName)
  const { name, value_type: type, value_options: valueOptions, required: isRequired, label } = fieldValues
  const labelWithDefault = label || startCase(name)

  // show dropdown types
  if (includes(DROPDOWN_TYPES, type)) {
    const options = map(valueOptions, (option) => ({ label: option, value: option }))

    let placeholder: string | undefined = undefined
    if (type === MULTI_SELECT) {
      placeholder = 'All Data Selected'
    }

    return (
      <Controller
        control={control}
        name={`${fieldName}.value`}
        rules={{ validate: isRequired ? required : undefined }}
        render={({ field, fieldState: { isTouched: touched, error } }) => (
          <FormItem
            label={labelWithDefault}
            layout="vertical"
            meta={{ touched, error: error?.message }}
            required={isRequired}
          >
            <SearchSelect
              {...field}
              options={options}
              placeholder={placeholder}
              popupMatchSelectWidth={false}
              mode={includes(MULTIPLE_DROPDOWN_TYPES, type) ? 'multiple' : undefined}
              style={{ minWidth: '240px' }}
            />
          </FormItem>
        )}
      />
    )
  }

  // show number, revenue, or percent
  if (type === NUMBER_TYPE || type === REVENUE_TYPE || type === PERCENT_TYPE) {
    return (
      <Controller
        control={control}
        name={`${fieldName}.value`}
        rules={{ validate: isRequired ? required : undefined }}
        render={({ field, fieldState: { isTouched: touched, error } }) => (
          <FormItem
            label={labelWithDefault}
            layout="vertical"
            required={isRequired}
            meta={{ touched, error: error?.message }}
          >
            <InputNumber
              {...field}
              // TODO: should we make the currency based on company?
              addonBefore={type === REVENUE_TYPE ? '$' : undefined}
              addonAfter={type === PERCENT_TYPE ? '%' : undefined}
              style={{ minWidth: '120px' }}
              formatter={(value) => formatNumber(value)}
              placeholder="Number"
            />
          </FormItem>
        )}
      />
    )
  }

  // show number range
  if (type === NUMBER_RANGE) {
    return (
      <FormItem label={labelWithDefault} layout="vertical">
        <Flex alignItems="center">
          <Controller
            control={control}
            name={`${fieldName}.value.from`}
            rules={{ validate: isRequired ? required : undefined }}
            render={({ field, fieldState: { isTouched: touched, error } }) => (
              <FormItem meta={{ touched, error: error?.message }} required={isRequired}>
                <Flex alignItems="center">
                  <Typography mr={1}>from</Typography>{' '}
                  <InputNumber {...field} formatter={(value) => formatNumber(value)} placeholder="No min" />
                </Flex>
              </FormItem>
            )}
          />

          <Controller
            control={control}
            name={`${fieldName}.value.to`}
            rules={{ validate: isRequired ? required : undefined }}
            render={({ field, fieldState: { isTouched: touched, error } }) => (
              <FormItem meta={{ touched, error: error?.message }}>
                <Flex alignItems="center">
                  <Typography mx={1}>to</Typography>{' '}
                  <InputNumber {...field} formatter={(value) => formatNumber(value)} placeholder="No max" />
                </Flex>
              </FormItem>
            )}
          />
        </Flex>
      </FormItem>
    )
  }

  if (type === TIME_RANGE) {
    return (
      <FormItem label={labelWithDefault} layout="vertical" required={isRequired}>
        <WithinTimeSelect fieldName={`${fieldName}.value`} isRequired={isRequired} />
      </FormItem>
    )
  }

  // show date picker
  if (type === DATE_TYPE) {
    const dateIsValid = moment(fieldValues?.value).isValid()

    return (
      <Controller
        control={control}
        name={`${fieldName}.value`}
        rules={{ validate: isRequired ? required : undefined }}
        render={({ field, fieldState: { isTouched: touched, error } }) => (
          <FormItem label={labelWithDefault} meta={{ touched, error: error?.message }} required={isRequired}>
            <CompanyTimezoneDatePicker {...field} resolution="date" value={dateIsValid ? fieldValues.value : null} />
          </FormItem>
        )}
      />
    )
  }

  // show text input
  if (type === TEXT_TYPE) {
    return (
      <Controller
        control={control}
        name={`${fieldName}.value`}
        rules={{ validate: isRequired ? required : undefined }}
        render={({ field, fieldState: { isTouched: touched, error } }) => (
          <FormItem
            label={labelWithDefault}
            layout="vertical"
            meta={{ touched, error: error?.message }}
            required={isRequired}
          >
            <Input {...field} />
          </FormItem>
        )}
      />
    )
  }

  // TODO: show other types (not currently available)
  return null
}

export default DynamicField
