import { DatePicker, TimePicker } from 'components/antd/TimeComponents'
import { Box, Flex } from 'components/shared/jawns'
import { isEmpty } from 'lodash'
import moment from 'moment-timezone'
import { useEffect } from 'react'
import { Field, useField } from 'react-final-form'

import StyledLabel from './StyledLabel'

const RepeatsAt = () => {
  const {
    input: { value: segmentation },
  } = useField('segmentation')

  const {
    input: { value: repeatsAt, onChange: onChangeRepeatsAt },
  } = useField('repeats_at')

  useEffect(() => {
    // set default for all segmententation except mintute/hour
    if (segmentation !== 'minute' && segmentation !== 'hour' && isEmpty(repeatsAt)) {
      // (7AM) for everything but year
      if (segmentation !== 'year') {
        onChangeRepeatsAt(moment('7:00', 'HH:mm'))
      }

      if (segmentation === 'year') {
        // year defaults to current month, day, and time
        onChangeRepeatsAt(moment().format('MMM Do HH:mm'))
      }
    }

    // clear out repeats_at if switching to minute or hour
    if (segmentation === 'minute' || (segmentation === 'hour' && !isEmpty(repeatsAt))) {
      onChangeRepeatsAt(undefined)
    }
  }, [segmentation, repeatsAt, onChangeRepeatsAt])

  // only show repeats at for segmentation day or greater
  if (segmentation === 'minute' || segmentation === 'hour') {
    return null
  }

  return (
    <Flex alignItems="center" my={1}>
      <StyledLabel>Repeats at</StyledLabel>

      <Box>
        {segmentation === 'year' ? (
          <Field name="repeats_at" render={({ input }) => <DatePicker format="MMM Do HH:mm" showTime {...input} />} />
        ) : (
          <Field name="repeats_at" render={({ input }) => <TimePicker format="HH:mm" {...input} />} />
        )}
      </Box>
    </Flex>
  )
}

export default RepeatsAt
