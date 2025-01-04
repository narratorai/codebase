import { CloseOutlined } from '@ant-design/icons'
import { Tag, Typography } from 'antd-next'

const NotActionable = () => (
  <Tag color="red" style={{ alignContent: 'center', padding: '0px 8px', margin: '0px' }}>
    <CloseOutlined />
    <Typography.Text>Not Actionable</Typography.Text>
  </Tag>
)

export default NotActionable
