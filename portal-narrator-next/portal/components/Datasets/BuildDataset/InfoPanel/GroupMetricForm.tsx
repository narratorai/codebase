import { Button, Checkbox, InputNumber } from 'antd-next'
import { FormItem } from 'components/antd/staged'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { Box, Condition, Flex } from 'components/shared/jawns'
import { find, get, isEmpty, keys, map, startCase, toLower } from 'lodash'
import { useContext } from 'react'
import { Field, Form } from 'react-final-form'
import { useToggle } from 'react-use'
import {
  AGG_FUNCTION_COUNT,
  AGG_FUNCTION_COUNT_ALL,
  AGG_FUNCTION_COUNT_ALL_LABEL,
  AGG_FUNCTION_PERCENTILE_CONT,
  AGG_FUNCTION_RATE,
  dedupeLabel,
  DEFAULT_GROUP_BY_METRIC,
  getGroupFromContext,
} from 'util/datasets'
import { IDatasetQueryColumn, IDatasetQueryGroupMetric } from 'util/datasets/interfaces'
import { required } from 'util/forms'

import MetricAggFunctionSelect from './MetricAggFunctionSelect'
import MetricColumnSelect from './MetricColumnSelect'

const NEW_METRIC = {
  ...DEFAULT_GROUP_BY_METRIC,
  agg_function: AGG_FUNCTION_COUNT,
  column_id: null,
  id: '',
  label: '',
}

const AGG_FIELDNAME = 'agg_function'

interface Props {
  isEdit: boolean
  editColumn: IDatasetQueryGroupMetric
  onClose: () => void
}

const GroupMetricForm = ({ isEdit, editColumn, onClose }: Props) => {
  const { groupSlug, machineCurrent, machineSend } = useContext(DatasetFormContext) || {}
  const [autoReset, toggleAutoReset] = useToggle(true)
  const group = getGroupFromContext({ context: machineCurrent.context, groupSlug })
  const { columns } = machineCurrent.context

  const handleSubmit = (formValue: any) => {
    if (autoReset || !isEdit) {
      const aggValue = formValue.agg_function
      const columnId = formValue.column_id
      const parentColumn = find(columns, ['id', columnId]) || ({} as IDatasetQueryColumn)
      const cleanAggFunctionLabel = aggValue === AGG_FUNCTION_COUNT_ALL ? AGG_FUNCTION_COUNT_ALL_LABEL : aggValue
      const potentialLabel = isEmpty(parentColumn)
        ? startCase(toLower(cleanAggFunctionLabel))
        : startCase(`${toLower(cleanAggFunctionLabel)} ${toLower(parentColumn.label)}`)
      const existingLabels = map(group?.metrics, 'label')
      const label = dedupeLabel({ existingLabels, label: potentialLabel })

      formValue.label = label
    }

    machineSend('EDIT_METRIC_COLUMN_SUBMIT', {
      isEdit,
      groupSlug,
      metricColumn: formValue,
      label: formValue.label,
    })
  }

  const getIsDisabled = (values: any, errors: any) => {
    const isCountAll = get(values, 'agg_function') === AGG_FUNCTION_COUNT_ALL
    const isRate = get(values, 'agg_function') === AGG_FUNCTION_RATE

    if (!isCountAll && isEmpty(values.column_id)) {
      return true
    }

    // RATE aggs, must have at least one timestamp conditioned_on_columns selected
    if (isRate && isEmpty(values.conditioned_on_columns)) {
      return true
    }

    if (!isEmpty(errors)) {
      if (isCountAll) {
        // It's a real error if: there is more than one error or the one error is NOT: column_id: "required"
        if (keys(errors).length > 1 || errors?.['column_id']?.toLowerCase() !== 'required') {
          return true
        }
      }

      return true
    }

    return false
  }

  return (
    <Form
      onSubmit={handleSubmit}
      initialValues={isEdit ? editColumn : NEW_METRIC}
      render={({ handleSubmit, values, errors }) => (
        <form onSubmit={handleSubmit}>
          <div data-public>
            <MetricAggFunctionSelect fieldName={AGG_FIELDNAME} addRecordCount />
            <Condition when={AGG_FIELDNAME} is={AGG_FUNCTION_PERCENTILE_CONT}>
              <Field
                name="percentile"
                validate={required}
                render={({ input, meta }) => (
                  <FormItem label="Decimal Percentile" meta={meta} layout="vertical" required>
                    <InputNumber placeholder="ex: .25" {...input} />
                  </FormItem>
                )}
              />
            </Condition>
            <Box style={{ maxWidth: '340px' }}>
              <MetricColumnSelect />
            </Box>
            {isEdit && (
              <Checkbox checked={autoReset} onChange={toggleAutoReset}>
                Reset Name
              </Checkbox>
            )}
            <Flex justifyContent="flex-end">
              <Box mr={1}>
                <Button onClick={onClose}>Cancel</Button>
              </Box>
              <Button
                type="primary"
                onClick={handleSubmit}
                disabled={getIsDisabled(values, errors)}
                data-test="add-group-metric-cta"
              >
                {isEdit ? 'Done' : 'Add Metric'}
              </Button>
            </Flex>
          </div>
        </form>
      )}
    />
  )
}

export default GroupMetricForm
