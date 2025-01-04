import { PlusOutlined } from '@ant-design/icons'
import { Button } from 'antd-next'

interface Props {
  onClick: () => void
}

const AddButton = ({ onClick }: Props) => (
  <Button onClick={onClick} icon={<PlusOutlined />} block size="large">
    Add
  </Button>
)

export default AddButton
