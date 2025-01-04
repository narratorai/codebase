import _ from 'lodash'
import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
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
import ValueKindSelect, { ValueKindOptionOverrides } from '../ValueKindSelect'

interface Props {
  filterFieldName: string
  rangeType: string
  omitColumnIds?: string[]
  hideValueKinds?: boolean
  valueKindOptionOverrides?: ValueKindOptionOverrides
}

const TimeRangeValue = ({
  filterFieldName,
  rangeType,
  omitColumnIds,
  hideValueKinds,
  valueKindOptionOverrides,
}: Props) => {
  const { watch, setValue } = useFormContext()

  const filterType = watch(`${filterFieldName}.${rangeType}_type`)
  const prevFilterType = usePrevious(filterType)

  const kindValue = watch(`${filterFieldName}.${rangeType}_value_kind`)
  const prevKindValue = usePrevious(kindValue)

  const rangeValue = watch(`${filterFieldName}.${rangeType}_value`)

  // CLEAR out the filter value if you change the kind (column_id <-> value)
  useEffect(() => {
    if (prevKindValue && !_.isEqual(prevKindValue, kindValue)) {
      setValue(`${filterFieldName}.${rangeType}_value`, null, { shouldValidate: true })
      setValue(`${filterFieldName}.${rangeType}_value_resolution`, null, { shouldValidate: true })
    }
  }, [prevKindValue, kindValue, setValue, filterFieldName, rangeType])

  // If TimeFilterKindSelect has changed, clear out the values so it doesn't error out
  // b/c of incorrect time format i.e:
  // weeks  - vs -  2020-01-22T00:00:00Z  - vs -  7 with to_value_resolution: "hour"
  useEffect(() => {
    if (prevFilterType && !_.isEqual(prevFilterType, filterType)) {
      setValue(`${filterFieldName}.${rangeType}_value`, null, { shouldValidate: true })
      setValue(`${filterFieldName}.${rangeType}_value_resolution`, null, { shouldValidate: true })
    }
  }, [prevFilterType, filterType, setValue, filterFieldName, rangeType])

  if (filterType === TIME_FILTER_KIND_ABSOLUTE) {
    return (
      <>
        {!hideValueKinds && (
          <ValueKindSelect
            fieldName={`${filterFieldName}.${rangeType}_value_kind`}
            optionValueOverrides={valueKindOptionOverrides}
          />
        )}

        {kindValue === FILTER_KIND_COLUMN ? (
          <ColumnSelect
            fieldName={`${filterFieldName}.${rangeType}_value`}
            placeholder="Select column"
            columnTypes={[COLUMN_TYPE_TIMESTAMP]}
            omitColumnIds={omitColumnIds}
            noStyle
          />
        ) : kindValue === FILTER_KIND_FIELD ? (
          <FieldSlugInput fieldName={`${filterFieldName}.${rangeType}_value`} shouldUnregister />
        ) : (
          <DatetimeField fieldName={`${filterFieldName}.${rangeType}_value`} shouldUnregister />
        )}
      </>
    )
  }

  if (filterType === TIME_FILTER_KIND_RELATIVE) {
    return (
      <>
        {!hideValueKinds && (
          <ValueKindSelect
            fieldName={`${filterFieldName}.${rangeType}_value_kind`}
            optionValueOverrides={valueKindOptionOverrides}
          />
        )}

        {kindValue === FILTER_KIND_COLUMN ? (
          <ColumnSelect
            fieldName={`${filterFieldName}.${rangeType}_value`}
            placeholder="Select column"
            columnTypes={NUMBER_COLUMN_TYPES}
            omitColumnIds={omitColumnIds}
            noStyle
          />
        ) : kindValue === FILTER_KIND_FIELD ? (
          <FieldSlugInput fieldName={`${filterFieldName}.${rangeType}_value`} shouldUnregister />
        ) : (
          <NumberField fieldName={`${filterFieldName}.${rangeType}_value`} style={{ width: 65 }} shouldUnregister />
        )}

        <TimeSegmentationSelect
          fieldName={`${filterFieldName}.${rangeType}_value_resolution`}
          kind={TIME_FILTER_KIND_RELATIVE}
          plural={_.toInteger(rangeValue) !== 1}
          shouldUnregister
        />
      </>
    )
  }

  if (filterType === TIME_FILTER_KIND_COLLOQUIAL) {
    return (
      <TimeSegmentationSelect
        fieldName={`${filterFieldName}.${rangeType}_value`}
        kind={TIME_FILTER_KIND_COLLOQUIAL}
        shouldUnregister
      />
    )
  }

  return null
}

export default TimeRangeValue
