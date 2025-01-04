import { SelectProps } from 'antd/lib/select'
import { Select, Tooltip } from 'antd-next'
import { SearchSelect, SearchSelectOptionProps } from 'components/antd/staged'
import Mark from 'components/shared/Mark'
import { includes, isEmpty } from 'lodash'
import { Controller, useFormContext } from 'react-hook-form'
import {
  COLUMN_TYPE_BOOLEAN,
  COLUMN_TYPE_TIMESTAMP,
  FILTER_KIND_COLUMN,
  FILTER_KIND_FIELD,
  FILTER_KIND_VALUE,
  makeBooleanOperatorOptions,
  makeNumberOperatorOptions,
  makeStringOperatorOptions,
  makeTimeOperatorOptions,
  NUMBER_COLUMN_TYPES,
  STRING_COLUMN_TYPES,
} from 'util/datasets'

const { Option } = Select

export const makeFilterOperatorOptions = ({
  columnType,
  pluralizeLabels = false,
  allowMultiple = false,
  allowTimeRange = true,
}: {
  columnType?: string
  pluralizeLabels?: boolean
  allowMultiple?: boolean
  allowTimeRange?: boolean
}): { label: string; value: string; disabled?: boolean }[] => {
  if (includes(STRING_COLUMN_TYPES, columnType)) {
    return makeStringOperatorOptions(pluralizeLabels, allowMultiple)
  }

  if (columnType === COLUMN_TYPE_TIMESTAMP) {
    return makeTimeOperatorOptions(pluralizeLabels, allowTimeRange)
  }

  if (includes(NUMBER_COLUMN_TYPES, columnType)) {
    return makeNumberOperatorOptions(pluralizeLabels)
  }

  if (columnType === COLUMN_TYPE_BOOLEAN) {
    return makeBooleanOperatorOptions(pluralizeLabels)
  }

  // default to empty options
  return []
}

const shouldAllowMultipleOptions = (kind?: string) =>
  isEmpty(kind) || kind === FILTER_KIND_VALUE || kind === FILTER_KIND_FIELD

interface Props extends SelectProps {
  columnType?: string
  fieldName: string
  pluralizeLabels?: boolean
  // Passed into FormField:
  inputProps?: any
  kind?: string
  allowTimeRange?: boolean
}

const FilterOperatorSelect = ({
  columnType,
  fieldName,
  pluralizeLabels = false,
  kind,
  inputProps,
  allowTimeRange = true,
  ...props
}: Props) => {
  let kindLabel = ''
  switch (kind) {
    case FILTER_KIND_VALUE:
      kindLabel = 'value'
      break
    case FILTER_KIND_COLUMN:
      kindLabel = 'column'
      break
    case FILTER_KIND_FIELD:
      kindLabel = 'field'
  }

  const { control } = useFormContext()

  const allowMultiple = shouldAllowMultipleOptions(kind)
  const options = makeFilterOperatorOptions({ columnType, pluralizeLabels, allowMultiple, allowTimeRange })

  const handleCreateOptionContent = ({
    searchValue,
    option,
  }: {
    searchValue: string
    option: SearchSelectOptionProps
  }) => (
    <Option key={option.value} value={option.value} disabled={option.disabled}>
      <Tooltip
        title={option.disabled ? `The "${option.label}" filter does not support ${kindLabel} values.` : ''}
        placement="right"
        overlayStyle={{ paddingLeft: 24 }}
      >
        <div>
          <Mark value={option.label} snippet={searchValue} />
        </div>
      </Tooltip>
    </Option>
  )

  return (
    <Controller
      control={control}
      name={fieldName}
      render={({ field }) => (
        <SearchSelect
          data-test="filter-operator-select"
          style={{ minWidth: 100 }}
          placeholder="Filter"
          popupMatchSelectWidth={false}
          showSearch
          optionFilterProp="label"
          options={options}
          createOptionContent={handleCreateOptionContent}
          {...field}
          {...props}
        />
      )}
    />
  )
}

export default FilterOperatorSelect
