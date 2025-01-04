import { Input } from 'antd-next'
import { isEmpty } from 'lodash'
import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'

import ResolutionAndTimeValue from './ResolutionAndTimeValue'

interface Props {
  fieldName: string
  asGroup?: boolean
  disabled?: boolean
  shouldUnregister?: boolean
}

const DatetimeField = ({ fieldName, asGroup = false, disabled = false, shouldUnregister }: Props) => {
  const { watch, setValue } = useFormContext()

  const timeValue = watch(fieldName)
  const resolution = watch(`${fieldName}_resolution`)
  const onChangeResolution = (value: string) => setValue(`${fieldName}_resolution`, value)

  useEffect(() => {
    // set resolution if none exists
    if (isEmpty(resolution)) {
      // as a backfill, default resolution to 'date_time' if there was a value, but no resolution
      if (!isEmpty(timeValue)) {
        onChangeResolution('date_time')
      }

      // if no resolution and no value, we will default to 'date' (new default)
      if (isEmpty(timeValue)) {
        onChangeResolution('date')
      }
    }
  }, [resolution, timeValue, onChangeResolution])

  // use asGroup if it's stand alone (if you put it in an Input.Group inside of another Input.Group it wont align horizontally)
  if (asGroup) {
    return (
      <Input.Group compact>
        <ResolutionAndTimeValue
          fieldName={fieldName}
          resolution={resolution}
          disabled={disabled}
          shouldUnregister={shouldUnregister}
        />
      </Input.Group>
    )
  }

  // don't use group when already within an Input.Group
  return (
    <ResolutionAndTimeValue
      fieldName={fieldName}
      resolution={resolution}
      disabled={disabled}
      shouldUnregister={shouldUnregister}
    />
  )
}

export default DatetimeField
