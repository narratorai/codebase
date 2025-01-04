import { Select, Tooltip } from 'antd-next'
import { SearchSelect, SearchSelectOptionProps } from 'components/antd/staged'
import Mark from 'components/shared/Mark'
import { includes, isEmpty } from 'lodash'
import { useMemo } from 'react'
import { Field } from 'react-final-form'
import {
  COLUMN_TYPE_TIMESTAMP,
  FILTER_KIND_COLUMN,
  FILTER_KIND_FIELD,
  FILTER_KIND_VALUE,
  makeNumberOperatorOptions,
  makeStringOperatorOptions,
  makeTimeOperatorOptions,
  STRING_COLUMN_TYPES,
} from 'util/datasets'

const { Option } = Select

interface Props {
  columnType?: string
  fieldName: string
  pluralizeLabels?: boolean
  // Passed into FormField:
  inputProps?: any
  kind?: string
}

const FilterOperatorSelect = ({
  columnType,
  fieldName,
  pluralizeLabels = false,
  kind,
  inputProps,
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

  const allowMultiple = isEmpty(kind) || kind === FILTER_KIND_VALUE || kind === FILTER_KIND_FIELD

  const options: SearchSelectOptionProps[] = useMemo(() => {
    // string columns
    if (includes(STRING_COLUMN_TYPES, columnType)) {
      return makeStringOperatorOptions(pluralizeLabels, allowMultiple)
    }

    // timestamp columns
    if (columnType === COLUMN_TYPE_TIMESTAMP) {
      return makeTimeOperatorOptions(pluralizeLabels)
    }

    // otherwise it's a number column
    return makeNumberOperatorOptions(pluralizeLabels)
  }, [columnType, pluralizeLabels])

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
    <Field
      name={fieldName}
      render={({ input }) => (
        <SearchSelect
          data-test="filter-operator-select"
          style={{ minWidth: 100 }}
          placeholder="Filter"
          popupMatchSelectWidth={false}
          showSearch
          optionFilterProp="label"
          options={options}
          createOptionContent={handleCreateOptionContent}
          {...input}
          {...props}
        />
      )}
    />
  )
}

export default FilterOperatorSelect
