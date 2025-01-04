import { FormItemProps } from 'antd/es/form'
import { FormItem, SearchSelect } from 'components/antd/staged'
import { Typography } from 'components/shared/jawns'
import cronstrue from 'cronstrue'
import { includes, isEmpty, map, startsWith } from 'lodash'
import { useEffect, useState } from 'react'
import { FieldMetaState } from 'react-final-form'
import usePrevious from 'util/usePrevious'

import CustomCronModal from './CustomCron/CustomCronModal'

interface Props extends FormItemProps {
  id?: string
  meta?: FieldMetaState<any>
  selectProps: {
    onSelect: (value: string) => void
    value?: string
    getPopupContainer?: boolean
    disabled?: boolean
    // Note: can't have default values if we allowClear
    allowClear?: boolean
  }
}

interface SelectOption {
  label: string
  value: string
}

export const DEFUALT_CRON_VALUE = '? 7 * * 1'

const CUSTOM_VALUE = 'custom'

const CRON_OPTIONS: SelectOption[] = [
  {
    label: 'Every 3 Hours',
    value: '? */3 * * *',
  },
  {
    label: 'Every Day at around 6 am',
    value: '? 6 * * *',
  },
  {
    label: 'Every week on Monday at around 7 am',
    value: DEFUALT_CRON_VALUE,
  },
  {
    label: 'Every Month on the 1st at around 7am',
    value: '? 7 1 * *',
  },
  {
    label: 'Custom',
    value: CUSTOM_VALUE,
  },
]

const CronSelectFormItem = ({
  id = 'cron-select-form-item',
  selectProps: { onSelect, value, getPopupContainer = false, disabled = false, allowClear = false },
  meta,
  label,
  hasFeedback = false,
  required = false,
}: Props) => {
  // make sure `value` is always defined (as currentValue)
  // unless it has been cleared (allowClear can't have default values)
  let currentValue = value || ''
  if (!allowClear && currentValue === '') {
    currentValue = DEFUALT_CRON_VALUE
  }

  const prevCurrentValue = usePrevious(currentValue)

  const [options, setOptions] = useState<SelectOption[]>(CRON_OPTIONS)
  const [customScheduleOpen, setCustomScheduleOpen] = useState(false)

  const makeCustomOption = (value: string) => {
    const newLabel = `(Custom) ${cronstrue.toString(value)}`
    return { value, label: newLabel }
  }

  // trigger `onSelect` on initial load
  // with the "fixed" value of `value` (which
  // whould be `DEFUALT_CRON_VALUE` if it is empty)
  useEffect(() => {
    // don't set default value if allowClear
    if (!prevCurrentValue && !allowClear) {
      onSelect(currentValue)
    }
  }, [allowClear, onSelect, currentValue, prevCurrentValue])

  // if initial cron is not a part of CRON_OPTIONS
  // set add it to the initial dropdown options
  useEffect(() => {
    const optionsValues = map(options, (op) => op.value)
    if (currentValue && !isEmpty(currentValue) && !includes(optionsValues, currentValue)) {
      const newOption = makeCustomOption(currentValue)
      setOptions([newOption, ...options])
    }
  }, [options, setOptions, currentValue])

  const shouldWarnSelect = meta ? startsWith(currentValue, '*') && meta?.valid : startsWith(currentValue, '*')

  const handleToggleModal = () => {
    setCustomScheduleOpen((prevOpened) => !prevOpened)
  }

  const handleOnSelect = (value: string) => {
    if (value === CUSTOM_VALUE) {
      // open the custom schedule modal
      handleToggleModal()
    } else {
      onSelect(value)
    }
  }

  const handleOnClear = () => {
    onSelect('')
  }

  return (
    <FormItem
      id={id}
      label={label}
      meta={meta}
      hasFeedback={hasFeedback}
      required={required}
      validateStatus={shouldWarnSelect ? 'warning' : undefined}
      help={
        shouldWarnSelect ? (
          <Typography color="yellow700">This will update very often! Are you sure?</Typography>
        ) : undefined
      }
    >
      <SearchSelect
        value={currentValue}
        onSelect={handleOnSelect}
        disabled={disabled}
        popupMatchSelectWidth={false}
        getPopupContainer={getPopupContainer ? (trigger: any) => trigger.parentNode : undefined} // make dropdown stick on modals
        options={options}
        allowClear={allowClear}
        onClear={handleOnClear}
      />

      <CustomCronModal visible={customScheduleOpen} onClose={handleToggleModal} handleOnSelect={handleOnSelect} />
    </FormItem>
  )
}

export default CronSelectFormItem
