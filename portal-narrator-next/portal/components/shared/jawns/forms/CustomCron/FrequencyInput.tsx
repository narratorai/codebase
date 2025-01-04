import { InputNumber } from 'antd-next'
import { isEqual, isFinite } from 'lodash'
import { useEffect } from 'react'
import { Field, useField } from 'react-final-form'
import usePrevious from 'util/usePrevious'

import { MAX_FREQUENCIES } from './constants'

const FrequencyInput = () => {
  const {
    input: { value: segmentation },
  } = useField('segmentation')
  const {
    input: { value: frequency, onChange: frequencyOnChange },
  } = useField('frequency')
  const prevSegmentation = usePrevious(segmentation)

  // if segmentation changes to/from mintues
  useEffect(() => {
    if (!isEqual(prevSegmentation, segmentation)) {
      // default to 30 frequency if switching to mintues (30 mintues as default)
      if (segmentation === 'minute') {
        frequencyOnChange(30)
      }

      // set default to 1 if switching from minutes
      if (prevSegmentation === 'minute') {
        frequencyOnChange(1)
      }
    }
  }, [prevSegmentation, segmentation, frequencyOnChange])

  const max = isFinite(MAX_FREQUENCIES[segmentation]) ? MAX_FREQUENCIES[segmentation] : undefined

  const disabled = segmentation === 'week' || segmentation === 'year'

  // week and year can only be 1 (weekly, yearly)
  if (disabled && frequency !== 1) {
    frequencyOnChange(1)
  }

  return (
    <Field name="frequency" render={({ input }) => <InputNumber disabled={disabled} min={1} max={max} {...input} />} />
  )
}

export default FrequencyInput
