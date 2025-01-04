import { WidgetProps } from '@rjsf/core'
import { Button, Popconfirm } from 'antd-next'
import { ButtonType } from 'antd-next/es/button'
import { Box } from 'components/shared/jawns'
import { get, includes } from 'lodash'
import React from 'react'
import { triggerSchemaAndDataUpdates } from 'util/blocks/helpers'

import FormattedPopText from './FormattedPopText'

type BlockButtonType = ButtonType | 'tertiary' | 'ghost'

const VALID_BUTTON_TYPES: ButtonType[] = ['primary', 'dashed', 'link', 'text', 'default']

const BooleanButtonWidget = ({ id, value, formContext, label, disabled, onChange, options }: WidgetProps) => {
  const handleChange = () => {
    // Handle options.process_data and options.update_schema
    triggerSchemaAndDataUpdates(formContext, options, id)

    // Make sure it's cast as a boolean, then set it as the opposite value!
    onChange(!value)
  }

  // Button overrides from ui:options
  const tiny = get(options, 'tiny', false)
  const buttonType = get(options, 'button_type') as BlockButtonType
  const buttonWrapperStyle = get(options, 'button_wrapper_style', {}) as React.CSSProperties
  const danger = get(options, 'danger', false) as boolean
  const withPopconfirm = get(options, 'popconfirm', false)
  const popconfirmText = get(options, 'popconfirm_text', 'Are you sure?') as string

  // get button type from ui:options
  let antdType: ButtonType = 'default'
  if (includes(VALID_BUTTON_TYPES, buttonType)) {
    antdType = buttonType as ButtonType
  }

  // ghost is not a type, but we derive its value from buttonType from mavis
  const ghost = buttonType === 'ghost'

  // To allow for buttons in line with inputs that don't look terrible
  // (match height of FormField Inputs!)
  const inlineInput = get(options, 'inline_input_height', false)
  const inlineProps = inlineInput ? { pt: '26px' } : {}

  return (
    <Box {...inlineProps} style={buttonWrapperStyle} data-public>
      {withPopconfirm && (
        <Popconfirm title={<FormattedPopText text={popconfirmText} />} onConfirm={handleChange}>
          <Button type={antdType} ghost={ghost} danger={danger} disabled={disabled} size={tiny ? 'small' : undefined}>
            {label}
          </Button>
        </Popconfirm>
      )}

      {!withPopconfirm && (
        <Button
          type={antdType}
          ghost={ghost}
          danger={danger}
          onClick={handleChange}
          disabled={disabled}
          size={tiny ? 'small' : undefined}
        >
          {label}
        </Button>
      )}
    </Box>
  )
}

export default BooleanButtonWidget
