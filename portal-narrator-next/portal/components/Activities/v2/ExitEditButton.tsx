import { CloseOutlined } from '@ant-design/icons'
import { Button } from 'antd-next'
import { Link } from 'components/shared/jawns'

const ExitEditButton = () => {
  return (
    <Link to="/activities">
      <Button type="text" icon={<CloseOutlined />} />
    </Link>
  )
}

export default ExitEditButton
