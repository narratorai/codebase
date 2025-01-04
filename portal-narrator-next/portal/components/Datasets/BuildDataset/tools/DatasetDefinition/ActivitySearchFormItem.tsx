import { RefSelectProps, SelectProps } from 'antd-next/es/select'
import { FormItem } from 'components/antd/staged'
import DatasetDefinitionContext from 'components/Datasets/BuildDataset/tools/DatasetDefinition/DatasetDefinitionContext'
import { IDatasetDefinitionContext } from 'components/Datasets/BuildDataset/tools/DatasetDefinition/interfaces'
import ActivitySelect from 'components/shared/ActivitySelect/ActivitySelect'
import { cloneDeep, isEmpty, set } from 'lodash'
import { useContext, useEffect, useRef, useState } from 'react'
import { useFormContext } from 'react-hook-form'

interface Props {
  fieldName: string
  onFieldChange?: ({ value, values }: { value: string[]; values: Object }) => void
  processing?: boolean
  focusOnLoad?: boolean
  selectProps?: SelectProps<any>
  inputColor?: string | undefined
}

// TODO - this should be an actual activity search (ideally)
const ActivitySearchFormItem = ({
  fieldName,
  onFieldChange,
  processing,
  focusOnLoad = false,
  selectProps = {},
  inputColor,
}: Props) => {
  const { watch, setValue, getFieldState } = useFormContext()
  const { activityStream, streamActivities } = useContext<IDatasetDefinitionContext>(DatasetDefinitionContext)

  const selectRef = useRef<RefSelectProps>(null)
  const [multiSelect, setMultiSelect] = useState(false)
  const [showEnrichmentActivities, setShowEnrichmentActivities] = useState(true)

  const values = watch()
  const inputValue = watch(fieldName)
  const setFieldValue = (value: string | string[]) => {
    setValue(fieldName, value, { shouldValidate: true })
  }

  const { isTouched: touched, error } = getFieldState(fieldName)

  const handleChange = (value: string) => {
    // this field is always an array of activity_ids
    // This supports single activity select mode, where you can only select one activity
    // but the underlying field will always be an array
    const arrayValue = (multiSelect ? value : [value]) as string[]
    setFieldValue(arrayValue)

    // This is so we can send the form values into onFieldChange (the machine) without
    // waiting for the onChange above to persist to the global form state
    if (!isEmpty(value) && onFieldChange) {
      // Update the overall form values (the equivalent of the onChange above):
      const copyValues = cloneDeep(values)
      const updatedValues = set(copyValues, fieldName, arrayValue)
      onFieldChange({ value: arrayValue, values: updatedValues })
    }
  }

  const onToggleSelectMultiple = () => {
    if (multiSelect) {
      // If switching back from multiSelect to single select,
      // set the value back to the first one:
      if (inputValue[0]) {
        setFieldValue([inputValue[0]])
      }
      return setMultiSelect(false)
    }

    return setMultiSelect(true)
  }

  const onToggleShowEnrichmentActivities = () => {
    setShowEnrichmentActivities((prevShow) => !prevShow)
  }

  useEffect(() => {
    // Focus only if the user has an activityStream selected:
    if (focusOnLoad && selectRef && activityStream) {
      selectRef?.current?.focus()
    }
  }, [activityStream, selectRef, focusOnLoad])

  useEffect(() => {
    // Set multiSelect by default to true if editing multiple activities
    if (inputValue && inputValue.length > 1 && !multiSelect) {
      setMultiSelect(true)
    }
  }, [inputValue, multiSelect])

  return (
    <FormItem meta={{ touched, error: error?.message }} hasFeedback={processing} validateStatus="validating" compact>
      <ActivitySelect
        activities={streamActivities}
        selectRef={selectRef}
        inputColor={inputColor}
        multiSelect={multiSelect}
        onToggleMultiSelect={onToggleSelectMultiple}
        onToggleShowEnrichmentActivities={onToggleShowEnrichmentActivities}
        showEnrichmentActivities={showEnrichmentActivities}
        onChange={handleChange}
        value={inputValue}
        {...selectProps}
      />
    </FormItem>
  )
}

export default ActivitySearchFormItem
