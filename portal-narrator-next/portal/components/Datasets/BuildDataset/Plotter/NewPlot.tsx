import { PlusOutlined, TableOutlined } from '@ant-design/icons'
import { Button, Result, Space } from 'antd-next'

interface Props {
  newPlot: () => void
  backToTable: () => void
}

const NewPlot = ({ newPlot, backToTable }: Props) => (
  <Result
    title="This group has no saved plots"
    extra={
      <Space>
        <Button type="primary" onClick={newPlot}>
          <PlusOutlined /> Add New Plot
        </Button>

        <Button onClick={backToTable}>
          <TableOutlined /> Back to Table
        </Button>
      </Space>
    }
  />
)

export default NewPlot
