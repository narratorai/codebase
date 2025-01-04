import { CheckOutlined } from '@ant-design/icons'
import { Tag, Typography } from 'antd-next'

const Actionable = () => (
  <Tag color="green" style={{ alignContent: 'center', padding: '0px 8px', margin: '0px' }}>
    <CheckOutlined />
    <Typography.Text>Actionable</Typography.Text>
  </Tag>
)

export default Actionable
