import { WidgetProps } from '@rjsf/core'
import { Checkbox } from 'antd-next'
import { Box, Flex, Label } from 'components/shared/jawns'
import { get } from 'lodash'
import { triggerSchemaAndDataUpdates } from 'util/blocks/helpers'

const CheckboxWidget = ({
  id,
  value,
  formContext,
  label,
  disabled,
  readonly,
  autofocus,
  onChange,
  options,
}: WidgetProps) => {
  const handleChange = (event: any) => {
    // Handle options.process_data and options.update_schema
    triggerSchemaAndDataUpdates(formContext, options, id)

    onChange(event.target.checked)
  }

  // To allow for buttons in line with inputs that don't look terrible
  // (match height of FormField Inputs!)
  const inlineInput = get(options, 'inline_input_height', false)
  const inlineProps = inlineInput ? { pt: '40px' } : {}

  return (
    <Flex {...inlineProps} data-public>
      <Box>
        <Checkbox
          id={id}
          checked={value === true}
          disabled={disabled || readonly}
          autoFocus={autofocus}
          onChange={handleChange}
          style={{ cursor: 'pointer' }}
        />
      </Box>
      <Box ml="8px">
        <Label htmlFor={id} type="body50" style={{ cursor: 'pointer' }}>
          {label}
        </Label>
      </Box>
    </Flex>
  )
}

export default CheckboxWidget
