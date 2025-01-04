import { WidgetProps } from '@rjsf/core'
import SimpleColorPicker from 'components/shared/SimpleColorPicker'
import React from 'react'

const ColorWidget: React.FC<WidgetProps> = ({ disabled, readonly, onChange, value }) => {
  return <SimpleColorPicker disabled={disabled} readonly={readonly} onChange={onChange} value={value} />
}

export default ColorWidget
