import { DownloadOutlined } from '@ant-design/icons'
import { Button, Tooltip } from 'antd-next'
import { downloadTableDataAsCsv } from 'components/shared/DataTable/helpers'
import { ITableData } from 'components/shared/DataTable/interfaces'

interface Props {
  data: ITableData
  title?: string
}

const DownloadCsvIcon = ({ data, title }: Props) => {
  const handleDownloadAsCsv = () => {
    downloadTableDataAsCsv({ tableData: data, title })
  }

  return (
    <Tooltip title="Download as CSV">
      <Button onClick={handleDownloadAsCsv} icon={<DownloadOutlined />} size="small" type="text" />
    </Tooltip>
  )
}

export default DownloadCsvIcon
