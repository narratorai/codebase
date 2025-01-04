import { CheckOutlined, MinusOutlined } from '@ant-design/icons'
import { colors } from 'util/constants'

interface Props {
  isActionable: boolean | string | number | null | undefined
  iconStyleProps?: { [key: string]: string }
}

const ActionableIcon = ({ isActionable, iconStyleProps }: Props) => {
  if (isActionable === true) {
    return (
      <CheckOutlined
        style={{
          color: colors.green500,
          ...iconStyleProps,
        }}
      />
    )
  }

  return (
    <MinusOutlined
      style={{
        color: colors.yellow500,
        ...iconStyleProps,
      }}
    />
  )
}

export default ActionableIcon
