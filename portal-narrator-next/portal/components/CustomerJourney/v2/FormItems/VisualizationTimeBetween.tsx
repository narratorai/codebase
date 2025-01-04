import { InputNumber } from 'antd-next'
import { FormItem } from 'components/antd/staged'
import { SearchSelect } from 'components/antd/staged'
import { Box, Flex } from 'components/shared/jawns'
import pluralize from 'pluralize'
import { useEffect } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { required } from 'util/forms'

const TIME_BETWEEN_FIELDNAME = 'time_between'
const TIME_BETWEEN_RESOLUTION_FIELDNAME = 'time_between_resolution'
const TIME_BETWEEN_RESOLUTION_VALUES = ['minute', 'hour', 'day']
export const DEFAULT_TIME_BETWEEN = 1
export const DEFAULT_TIME_BETWEEN_RESOLUTION = 'minute'

function VisualizationTimeBetween() {
  const { control, watch, setValue } = useFormContext()

  const timeBetweenValue = watch(TIME_BETWEEN_FIELDNAME)
  const timeBetweenResolutionValue = watch(TIME_BETWEEN_RESOLUTION_FIELDNAME)

  const resolutionOptions = TIME_BETWEEN_RESOLUTION_VALUES.map((value) => ({
    label: pluralize(value, timeBetweenValue),
    value,
  }))

  // ensure time between is at least 1
  useEffect(() => {
    if (!timeBetweenValue) {
      setValue(TIME_BETWEEN_FIELDNAME, DEFAULT_TIME_BETWEEN, { shouldValidate: true })
    }
  }, [timeBetweenValue])

  // ensure resolution default is set to minute
  useEffect(() => {
    if (!timeBetweenResolutionValue) {
      setValue(TIME_BETWEEN_RESOLUTION_FIELDNAME, DEFAULT_TIME_BETWEEN_RESOLUTION, { shouldValidate: true })
    }
  }, [timeBetweenResolutionValue])

  return (
    <FormItem layout="vertical" label="Minimum time between one activity and the next">
      <Flex>
        <Box mr={1}>
          <Controller
            name={TIME_BETWEEN_FIELDNAME}
            control={control}
            rules={{ validate: required }}
            render={({ field, fieldState: { isTouched, error } }) => (
              <FormItem meta={{ touched: isTouched, error: error?.message }} required>
                <InputNumber min={1} {...field} />
              </FormItem>
            )}
          />
        </Box>

        <Controller
          name={TIME_BETWEEN_RESOLUTION_FIELDNAME}
          control={control}
          rules={{ validate: required }}
          render={({ field, fieldState: { isTouched, error } }) => (
            <FormItem meta={{ touched: isTouched, error: error?.message }} required>
              <SearchSelect {...field} options={resolutionOptions} />
            </FormItem>
          )}
        />
      </Flex>
    </FormItem>
  )
}

export default VisualizationTimeBetween
