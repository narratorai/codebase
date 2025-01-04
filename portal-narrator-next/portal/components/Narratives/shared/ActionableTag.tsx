import { CheckCircleOutlined, MinusOutlined } from '@ant-design/icons'
import { Tag } from 'antd-next'

interface Props {
  compiledActionable?: boolean | string | number | null
}

const ActionableTag = ({ compiledActionable }: Props) => {
  if (compiledActionable === true) {
    return (
      <Tag icon={<CheckCircleOutlined />} color="success">
        Actionable
      </Tag>
    )
  }

  if (compiledActionable === false) {
    return (
      <Tag icon={<MinusOutlined />} color="warning">
        Not Actionable Yet
      </Tag>
    )
  }

  return null
}

export default ActionableTag
