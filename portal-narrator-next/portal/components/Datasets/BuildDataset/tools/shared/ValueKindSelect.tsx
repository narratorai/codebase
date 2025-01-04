import { SelectProps } from 'antd/es/select'
import { Select, Tooltip } from 'antd-next'
import { SearchSelect, SearchSelectOptionProps } from 'components/antd/staged'
import Mark from 'components/shared/Mark'
import { includes } from 'lodash'
import { Field } from 'react-final-form'
import { FILTER_KIND_COLUMN, FILTER_KIND_FIELD, FILTER_KIND_VALUE, MULTI_SELECT_OPERATORS } from 'util/datasets'

const { Option } = Select

interface Props extends SelectProps<any> {
  fieldName: string
  operatorSelected?: string
}

const ValueKindSelect = ({ fieldName, operatorSelected, ...props }: Props) => {
  const multiOperatorSelected = includes(MULTI_SELECT_OPERATORS, operatorSelected)

  const options = [
    { label: 'value', value: FILTER_KIND_VALUE, disabled: false },
    { label: 'column', value: FILTER_KIND_COLUMN, disabled: multiOperatorSelected },
    { label: 'field', value: FILTER_KIND_FIELD, disabled: false },
  ]

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
    <Field
      name={fieldName}
      defaultValue={FILTER_KIND_VALUE}
      render={({ input }) => (
        <SearchSelect
          style={{ minWidth: 74 }}
          data-test="value-kind-select"
          placeholder="Filter type"
          options={options}
          createOptionContent={handleCreateOptionContent}
          {...input}
          {...props}
        />
      )}
    />
  )
}

export default ValueKindSelect
