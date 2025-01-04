import { SelectProps } from 'antd/es/select'
import { Select, Tooltip } from 'antd-next'
import { SearchSelect, SearchSelectOptionProps } from 'components/antd/staged'
import Mark from 'components/shared/Mark'
import { filter, includes } from 'lodash'
import { Controller, useFormContext } from 'react-hook-form'
import { FILTER_KIND_COLUMN, FILTER_KIND_FIELD, FILTER_KIND_VALUE, MULTI_SELECT_OPERATORS } from 'util/datasets'

const { Option } = Select

export type ValueKindOptionOverrides = [typeof FILTER_KIND_VALUE | typeof FILTER_KIND_COLUMN | typeof FILTER_KIND_FIELD]

interface ValueKindSelectProps extends SelectProps<any> {
  fieldName: string
  operatorSelected?: string
  optionValueOverrides?: ValueKindOptionOverrides
}

function ValueKindSelect({ fieldName, operatorSelected, optionValueOverrides, ...props }: ValueKindSelectProps) {
  const { control } = useFormContext()

  const multiOperatorSelected = includes(MULTI_SELECT_OPERATORS, operatorSelected)

  let options = [
    { label: 'value', value: FILTER_KIND_VALUE, disabled: false },
    { label: 'column', value: FILTER_KIND_COLUMN, disabled: multiOperatorSelected },
    { label: 'field', value: FILTER_KIND_FIELD, disabled: false },
  ]

  if (optionValueOverrides) {
    options = filter(options, (op) => includes(optionValueOverrides, op.value))
  }

  const handleCreateOptionContent = ({
    searchValue,
    option,
  }: {
    searchValue: string
    option: SearchSelectOptionProps
  }) => (
    <Option value={option.value} disabled={option.disabled} key={option.value}>
      <Tooltip
        title={option.disabled ? `The "${operatorSelected}" filter does not support ${option.label} values.` : ''}
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
      shouldUnregister
      defaultValue={FILTER_KIND_VALUE}
      render={({ field }) => (
        <SearchSelect
          style={{ minWidth: 74 }}
          data-test="value-kind-select"
          data-testid="value-kind-select"
          placeholder="Filter type"
          options={options}
          createOptionContent={handleCreateOptionContent}
          {...field}
          {...props}
        />
      )}
    />
  )
}
export default ValueKindSelect
