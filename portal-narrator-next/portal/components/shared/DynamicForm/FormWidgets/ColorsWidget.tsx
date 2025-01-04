import { WidgetProps } from '@rjsf/core'
import ColorsPicker from 'components/shared/ColorsPicker'

/**
 * For adding/updating/deleting multiple colors
 */
const ColorsWidget = ({ disabled, readonly, onChange, value }: WidgetProps) => {
  return <ColorsPicker disabled={disabled} readonly={readonly} onChange={onChange} value={value} />
}

export default ColorsWidget
