import { FormItem, FormItemProps, SearchSelect } from 'components/antd/staged'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import _ from 'lodash'
import React, { useContext } from 'react'
import { Field, useField } from 'react-final-form'
import {
  AGG_FUNCTION_COUNT_ALL,
  AGG_FUNCTION_COUNT_ALL_DROPDOWN_LABEL,
  AGG_FUNCTIONS,
  NUMBER_COLUMN_TYPES,
  NUMBER_ONLY_AGG_FUNCTIONS,
} from 'util/datasets'
import { required } from 'util/forms'

interface MetricAggFunctionSelectProps extends FormItemProps {
  fieldName: string
  lowerCase?: boolean
  addRecordCount?: boolean
}

const MetricAggFunctionSelect: React.FC<MetricAggFunctionSelectProps> = ({
  fieldName,
  lowerCase = false,
  addRecordCount = false,
  ...props
}) => {
  const { machineCurrent } = useContext(DatasetFormContext)

  const {
    input: { value: columnId },
  } = useField('column_id', { subscription: { value: true } })

  const parentColumn = _.find(machineCurrent.context.columns, ['id', columnId])
  const disallowedAggs =
    (parentColumn && (_.includes(NUMBER_COLUMN_TYPES, parentColumn.type) ? [] : NUMBER_ONLY_AGG_FUNCTIONS)) || []

  // For now RECORD_COUNT is the only conditionally added label
  const cleanAggFunctions = addRecordCount
    ? _.sortBy([...AGG_FUNCTIONS, AGG_FUNCTION_COUNT_ALL_DROPDOWN_LABEL])
    : AGG_FUNCTIONS

  const options = _.map(cleanAggFunctions, (agg) => {
    // We show the user COUNT_RECORD, but we send Mavis COUNT_ALL
    const value = agg === AGG_FUNCTION_COUNT_ALL_DROPDOWN_LABEL ? AGG_FUNCTION_COUNT_ALL : agg
    const formattedValue = lowerCase ? _.lowerCase(value) : value
    return {
      label: formattedValue,
      value: formattedValue,
      key: formattedValue,
      disabled: _.includes(disallowedAggs, agg),
    }
  })

  return (
    <Field
      name={fieldName}
      validate={required}
      render={({ input, meta }) => (
        <FormItem label="Select Agg Function" meta={meta} layout="vertical" required {...props}>
          <SearchSelect
            placeholder="Select Operator"
            optionFilterProp="label"
            style={{ width: 224 }}
            data-public
            options={options}
            {...input}
          />
        </FormItem>
      )}
    />
  )
}

MetricAggFunctionSelect.defaultProps = {
  fieldName: 'source_details.operation',
}

export default MetricAggFunctionSelect
