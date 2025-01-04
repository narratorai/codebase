import { SearchSelect } from 'components/antd/staged'
import { Box, Flex } from 'components/shared/jawns'
import { isEmpty } from 'lodash'
import { useEffect } from 'react'
import { Field, useField } from 'react-final-form'

import { MINTUE_OPTIONS } from './constants'
import StyledLabel from './StyledLabel'

const MinuteOfHour = () => {
  const {
    input: { value: segmentation },
  } = useField('segmentation')

  const {
    input: { value: minuteOfHour, onChange: onChangeMinuteOfHour },
  } = useField('minute_of_hour')

  useEffect(() => {
    // set default 0 minutes if no value
    if (segmentation === 'hour' && isEmpty(minuteOfHour)) {
      onChangeMinuteOfHour([0])
    }

    // clear out minute of hour if no longer hour
    if (segmentation !== 'hour' && !isEmpty(minuteOfHour)) {
      onChangeMinuteOfHour(undefined)
    }
  }, [segmentation, minuteOfHour, onChangeMinuteOfHour])

  // only show for segment hour
  if (segmentation !== 'hour') {
    return null
  }

  return (
    <Flex my={1} alignItems="center">
      <StyledLabel>At minute</StyledLabel>

      <Box>
        <Field
          name="minute_of_hour"
          render={({ input }) => (
            <SearchSelect style={{ minWidth: '96px' }} mode="multiple" options={MINTUE_OPTIONS} {...input} />
          )}
        />
      </Box>
    </Flex>
  )
}

export default MinuteOfHour
