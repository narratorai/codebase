import SimpleColorPicker from 'components/shared/SimpleColorPicker'

interface Props {
  index: number
  value: string
  onChange: ({ value, index }: { value: string; index: number }) => void
  onDelete: (index: number) => void
  disabled?: boolean
  readonly?: boolean
}

const SimpleColorPickerWrapper = ({ index, disabled, readonly, onChange, onDelete, value }: Props) => {
  const handleOnChange = (value: string) => {
    onChange({ value, index })
  }

  const handleOnDelete = () => {
    onDelete(index)
  }

  return (
    <SimpleColorPicker
      disabled={disabled}
      readonly={readonly}
      onChange={handleOnChange}
      onDelete={handleOnDelete}
      value={value}
      hideHexText
      colorBoxStyles={{ width: '24px', height: '24px' }}
    />
  )
}

export default SimpleColorPickerWrapper
