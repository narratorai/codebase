import { WidgetProps } from '@rjsf/core'
import { useBlockOverlayContext } from 'components/BlockOverlay/BlockOverlayProvider'
import CronSelectFormItem from 'components/shared/jawns/forms/CronSelectFormItem'

const CronSelectFormItemWidget = ({ id, value, disabled, required, onChange }: WidgetProps) => {
  // if visible, this widget is being rendered inside of the BlockOverlay
  // if so, make the dropdown menu stick to the input, rather than body
  const { visible: getPopupContainer } = useBlockOverlayContext()

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue)
  }

  return (
    <CronSelectFormItem
      id={id}
      selectProps={{
        value,
        onSelect: handleSelect,
        getPopupContainer, // make menu stick to select on scroll if in BlockOverlay
        disabled,
      }}
      required={required}
      hasFeedback
    />
  )
}

export default CronSelectFormItemWidget
