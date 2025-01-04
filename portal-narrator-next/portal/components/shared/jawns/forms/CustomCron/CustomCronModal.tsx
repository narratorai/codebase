import { Checkbox, Modal } from 'antd-next'
import { SearchSelect } from 'components/antd/staged'
import { TimePicker } from 'components/antd/TimeComponents'
import { Box, Flex } from 'components/shared/jawns'
import { isEmpty, isFinite, isString } from 'lodash'
import moment from 'moment-timezone'
import { useEffect } from 'react'
import { Field, Form, useField } from 'react-final-form'

import { DAY_OPTIONS, MONTH_DAYS_OPTIONS, MONTH_OPTIONS, SEGMENTATION_OPTIONS } from './constants'
import CronBuilder from './CronBuilder'
import FrequencyInput from './FrequencyInput'
import { handleTimeToCron } from './helpers'
import { CustomCronFormProps } from './interfaces'
import MinuteOfHour from './MinuteOfHour'
import RepeatsAt from './RepeatsAt'
import StyledLabel from './StyledLabel'

interface CustomCronModalProps {
  visible: boolean
  onClose: () => void
  handleOnSelect: (value: string) => void
}

const DEFAULT_VALUES: Partial<CustomCronFormProps> = {
  frequency: 1,
  segmentation: 'week',
}

const thisMonth = moment().month() + 1

const SegmentationSelect = () => {
  return (
    <Field
      name="segmentation"
      render={({ input }) => <SearchSelect options={SEGMENTATION_OPTIONS} style={{ minWidth: '96px' }} {...input} />}
    />
  )
}

// used when 'week' is selected
const RepeatOnWeekDays = () => {
  const {
    input: { value: segmentation },
  } = useField('segmentation')

  const {
    input: { value: repeatsOnDays, onChange: onChangeRepeatsOnDays },
  } = useField('repeats_on_week_days')

  useEffect(() => {
    // set default days if empty (defaults to Monday)
    if (segmentation === 'week' && isEmpty(repeatsOnDays)) {
      onChangeRepeatsOnDays([1])
    }

    // if no longer week, clear out repeats on days
    if (segmentation !== 'week' && !isEmpty(repeatsOnDays)) {
      onChangeRepeatsOnDays(undefined)
    }
  }, [segmentation, repeatsOnDays, onChangeRepeatsOnDays])

  // don't show for any segmentation but week
  if (segmentation !== 'week') {
    return null
  }

  return (
    <Flex my={1} alignItems="center">
      <StyledLabel>Repeats on</StyledLabel>
      <Field name="repeats_on_week_days" render={({ input }) => <Checkbox.Group options={DAY_OPTIONS} {...input} />} />
    </Flex>
  )
}

const RepeatOnMonthDays = () => {
  const {
    input: { value: segmentation },
  } = useField('segmentation')

  const {
    input: { value: repeatsOnDays, onChange: onChangeRepeatsOnDays },
  } = useField('repeats_on_month_days')

  useEffect(() => {
    // default to first day in the month
    if (segmentation === 'month' && isEmpty(repeatsOnDays)) {
      onChangeRepeatsOnDays([1])
    }

    // clear month days if segmentation is not month
    if (segmentation !== 'month' && !isEmpty(repeatsOnDays)) {
      onChangeRepeatsOnDays(undefined)
    }
  }, [segmentation, repeatsOnDays, onChangeRepeatsOnDays])

  // don't show for any segmentation but month
  if (segmentation !== 'month') {
    return null
  }

  return (
    <Flex my={1} alignItems="center">
      <StyledLabel>Repeats on</StyledLabel>
      <Field
        name="repeats_on_month_days"
        render={({ input }) => (
          <SearchSelect style={{ minWidth: '96px' }} options={MONTH_DAYS_OPTIONS} mode="multiple" {...input} />
        )}
      />
    </Flex>
  )
}

// used for over 1 month
const StartsOnMonth = () => {
  const {
    input: { value: segmentation },
  } = useField('segmentation')

  const {
    input: { value: frequency },
  } = useField('frequency')

  const {
    input: { value: startsOnMonth, onChange: onChangeStartsOnMonth },
  } = useField('starts_on_month')

  const showStartsOn = segmentation === 'month' && frequency > 1

  useEffect(() => {
    if (showStartsOn) {
      // set default month if it hasn't been set
      if (!isFinite(startsOnMonth) && segmentation === 'month') {
        onChangeStartsOnMonth(thisMonth)
      }

      // clear start on month if sementation is not month
      if (isFinite(startsOnMonth) && segmentation !== 'month') {
        onChangeStartsOnMonth(undefined)
      }
    }

    // clear start on month if no longer frequency > 1
    if (!showStartsOn && isFinite(startsOnMonth)) {
      onChangeStartsOnMonth(undefined)
    }
  }, [showStartsOn, startsOnMonth, segmentation])

  // don't show if not month and not greater than 1
  if (!showStartsOn) {
    return null
  }

  return (
    <Flex alignItems="center">
      <StyledLabel>Starts on</StyledLabel>

      <Box>
        <Field
          name="starts_on_month"
          render={({ input }) => <SearchSelect style={{ minWidth: '96px' }} options={MONTH_OPTIONS} {...input} />}
        />
      </Box>
    </Flex>
  )
}

const StartsOnHour = () => {
  const {
    input: { value: frequency },
  } = useField('frequency')

  const {
    input: { value: segmentation },
  } = useField('segmentation')

  const {
    input: { value: startsOnHour, onChange: onChangeStartsOnHour },
  } = useField('starts_on_hour')

  useEffect(() => {
    // add default startsOnHour if it hasn't been set (beginning of day)
    if (segmentation === 'hour' && isEmpty(startsOnHour)) {
      onChangeStartsOnHour(moment('0:00', 'HH:mm'))
    }

    // if not hour, clear out startsOnHour
    if (segmentation !== 'hour' && !isEmpty(startsOnHour)) {
      onChangeStartsOnHour(undefined)
    }
  }, [segmentation, startsOnHour, onChangeStartsOnHour])

  // don't show startsOn if segmentation is not hour
  // or only 1 hour (every hour)
  if (segmentation !== 'hour' || frequency === 1) {
    return null
  }

  return (
    <Flex alignItems="center" my={1}>
      <StyledLabel>Starting at</StyledLabel>

      <Box>
        <TimePicker
          format="HH:mm"
          // @ts-ignore: (only supports 1-59) but we want minutes to show as only 00
          // (not actually selectable - just for display)
          minuteStep={60}
          onChange={onChangeStartsOnHour}
          value={startsOnHour}
        />
      </Box>
    </Flex>
  )
}

const CustomCronModal = ({ visible, onClose, handleOnSelect }: CustomCronModalProps) => {
  const onSubmit = (values: CustomCronFormProps) => {
    const customCron = handleTimeToCron({ ...values })

    if (isString(customCron)) {
      handleOnSelect(customCron)
      onClose()
    }
  }

  return (
    <Form
      onSubmit={onSubmit}
      initialValues={DEFAULT_VALUES}
      render={({ handleSubmit }) => (
        <Modal open={visible} onCancel={onClose} onOk={handleSubmit}>
          <Box>
            <Flex alignItems="center">
              <StyledLabel>Repeat every</StyledLabel>
              <Box mr={2}>
                <FrequencyInput />
              </Box>
              <Box>
                <SegmentationSelect />
              </Box>
            </Flex>

            {/* for hour - let them select which minute to run and when to start running */}
            <MinuteOfHour />
            <StartsOnHour />

            {/* for all segments except minute and hour */}
            <RepeatsAt />

            {/* when 'week' is selected */}
            <RepeatOnWeekDays />

            {/* when 'month' is selected */}
            <RepeatOnMonthDays />

            {/* when over 1 month i.e. 3 months */}
            <StartsOnMonth />

            {/* show cron and translation */}
            <CronBuilder />
          </Box>
        </Modal>
      )}
    />
  )
}

export default CustomCronModal
