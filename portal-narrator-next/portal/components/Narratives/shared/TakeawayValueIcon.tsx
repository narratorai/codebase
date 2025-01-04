import { CheckOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons'
import { toInteger } from 'lodash'
import { colors } from 'util/constants'

interface TakeawayValueIconProps {
  value?: string | number
  withColor?: boolean
}

const TakeawayValueIcon = ({ value, withColor = true }: TakeawayValueIconProps) => {
  if (toInteger(value) === 1) {
    return (
      <CheckOutlined
        style={{
          color: withColor ? colors.green500 : undefined,
        }}
      />
    )
  }

  if (toInteger(value) === 0) {
    return (
      <PlusOutlined
        style={{
          color: withColor ? colors.yellow500 : undefined,
        }}
      />
    )
  }

  if (toInteger(value) === -1) {
    return (
      <MinusOutlined
        style={{
          color: withColor ? colors.red500 : undefined,
        }}
      />
    )
  }

  return null
}

export default TakeawayValueIcon
