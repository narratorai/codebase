import { Form } from 'antd-next'
import { FormItemProps as AntdFormItemProps } from 'antd-next/es/form'
import { FieldMetaState } from 'react-final-form'
import styled from 'styled-components'

export interface FormItemProps extends AntdFormItemProps {
  meta?: FieldMetaState<any>
  compact?: boolean
  layout?: 'horizontal' | 'vertical'
}

// https://github.com/narratorai/antd-custom/blob/7f308797b9db54f8a3e9843982065f91f1c8758f/lib/src/components/FormItem.tsx
const StyledFormItem = styled(Form.Item)<{ layout?: FormItemProps['layout'] }>`
  &.antd5-form-item-has-error {
    position: relative;
    z-index: 1;
  }

  .antd5-form-item-explain {
    margin-bottom: 16px;
  }

  .antd5-form-item-row {
    flex-flow: ${({ layout }) => (layout === 'vertical' ? 'column' : 'inherit')};
  }
`

const FormItem = ({
  meta,
  compact = false,
  hasFeedback,
  validateStatus,
  help,
  layout = 'horizontal',
  style = {},
  labelAlign,
  colon = false,
  label,
  ...props
}: FormItemProps) => {
  const hasError = meta?.error && meta?.touched

  return (
    <StyledFormItem
      layout={layout}
      help={hasError ? meta?.error : help} // we show errors in the help field
      hasFeedback={hasFeedback || hasError}
      validateStatus={hasError ? 'error' : validateStatus}
      labelAlign={labelAlign || (layout === 'vertical' ? 'left' : 'right')}
      colon={colon}
      style={{
        ...(compact ? { marginBottom: 0 } : {}),
        ...style,
      }}
      label={label && <span data-public>{label}</span>}
      {...props}
    />
  )
}

export default FormItem
