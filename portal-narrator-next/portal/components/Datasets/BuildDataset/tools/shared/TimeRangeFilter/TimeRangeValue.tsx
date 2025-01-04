import _ from 'lodash'
import { useEffect } from 'react'
import { Field, useField, useForm } from 'react-final-form'
import {
  COLUMN_TYPE_TIMESTAMP,
  FILTER_KIND_COLUMN,
  FILTER_KIND_FIELD,
  NUMBER_COLUMN_TYPES,
  TIME_FILTER_KIND_ABSOLUTE,
  TIME_FILTER_KIND_COLLOQUIAL,
  TIME_FILTER_KIND_RELATIVE,
} from 'util/datasets'
import usePrevious from 'util/usePrevious'

import ColumnSelect from '../ColumnSelect'
import DatetimeField from '../DatetimeField'
import FieldSlugInput from '../FieldSlugInput'
import NumberField from '../NumberField'
import TimeSegmentationSelect from '../TimeSegmentationSelect'
import ValueKindSelect from '../ValueKindSelect'

interface Props {
  filterFieldName: string
  rangeType: string
  omitColumnIds?: string[]
}

const TimeRangeValue = ({ filterFieldName, rangeType, omitColumnIds }: Props) => {
  const { change } = useForm()

  const { input } = useField(`${filterFieldName}.${rangeType}_type`, { subscription: { value: true } })
  const filterType = _.get(input, 'value')
  const prevFilterType = usePrevious(filterType)

  const { input: valueKindInput } = useField(`${filterFieldName}.${rangeType}_value_kind`, {
    subscription: { value: true },
  })
  const kindValue = valueKindInput.value
  const prevKindValue = usePrevious(kindValue)

  // CLEAR out the filter value if you change the kind (column_id <-> value)
  useEffect(() => {
    if (prevKindValue && !_.isEqual(prevKindValue, kindValue)) {
      change(`${filterFieldName}.${rangeType}_value`, null)
      change(`${filterFieldName}.${rangeType}_value_resolution`, null)
    }
  }, [prevKindValue, kindValue])

  // If TimeFilterKindSelect has changed, clear out the values so it doesn't error out
  // b/c of incorrect time format i.e:
  // weeks  - vs -  2020-01-22T00:00:00Z  - vs -  7 with to_value_resolution: "hour"
  useEffect(() => {
    if (prevFilterType && !_.isEqual(prevFilterType, filterType)) {
      change(`${filterFieldName}.${rangeType}_value`, null)
      change(`${filterFieldName}.${rangeType}_value_resolution`, null)
    }
  }, [prevFilterType, filterType])

  if (filterType === TIME_FILTER_KIND_ABSOLUTE) {
    return (
      <>
        <ValueKindSelect fieldName={`${filterFieldName}.${rangeType}_value_kind`} />
        {kindValue === FILTER_KIND_COLUMN ? (
          <ColumnSelect
            fieldName={`${filterFieldName}.${rangeType}_value`}
            placeholder="Select column"
            columnTypes={[COLUMN_TYPE_TIMESTAMP]}
            omitColumnIds={omitColumnIds}
            noStyle
          />
        ) : kindValue === FILTER_KIND_FIELD ? (
          <FieldSlugInput fieldName={`${filterFieldName}.${rangeType}_value`} />
        ) : (
          <DatetimeField fieldName={`${filterFieldName}.${rangeType}_value`} />
        )}
      </>
    )
  }

  if (filterType === TIME_FILTER_KIND_RELATIVE) {
    return (
      <>
        <ValueKindSelect fieldName={`${filterFieldName}.${rangeType}_value_kind`} />

        {kindValue === FILTER_KIND_COLUMN ? (
          <ColumnSelect
            fieldName={`${filterFieldName}.${rangeType}_value`}
            placeholder="Select column"
            columnTypes={NUMBER_COLUMN_TYPES}
            omitColumnIds={omitColumnIds}
            noStyle
          />
        ) : kindValue === FILTER_KIND_FIELD ? (
          <FieldSlugInput fieldName={`${filterFieldName}.${rangeType}_value`} />
        ) : (
          <NumberField fieldName={`${filterFieldName}.${rangeType}_value`} style={{ width: 65 }} />
        )}

        <Field
          name={`${filterFieldName}.${rangeType}_value`}
          subscription={{ value: true }}
          render={({ input: { value } }) => {
            return (
              <TimeSegmentationSelect
                fieldName={`${filterFieldName}.${rangeType}_value_resolution`}
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore: component is JS and this prop isn't typed correctly as `undefined`
                kind={TIME_FILTER_KIND_RELATIVE}
                plural={_.toInteger(value) !== 1}
              />
            )
          }}
        />
      </>
    )
  }

  if (filterType === TIME_FILTER_KIND_COLLOQUIAL) {
    return (
      <TimeSegmentationSelect
        fieldName={`${filterFieldName}.${rangeType}_value`}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: component is JS and this prop isn't typed correctly as `undefined`
        kind={TIME_FILTER_KIND_COLLOQUIAL}
      />
    )
  }

  return null
}

export default TimeRangeValue
