import { InfoCircleOutlined } from '@ant-design/icons'
import { Radio, Space, Tooltip } from 'antd-next'
import { Typography } from 'components/shared/jawns'

interface Props {
  value: 'dataset' | 'activity'
  onChange: (value: 'dataset' | 'activity') => void
  disabled?: boolean
}

const DatasetActivityRadio = ({ value, onChange, disabled }: Props) => {
  return (
    <Space>
      <Typography>Answer with:</Typography>
      <Radio.Group value={value} onChange={(e) => onChange(e.target.value)} buttonStyle="solid" disabled={disabled}>
        <Radio.Button value="dataset">Dataset</Radio.Button>
        <Radio.Button value="activity">Activity</Radio.Button>
      </Radio.Group>
      <Tooltip title="Dataset and Activity will be included in email context">
        <InfoCircleOutlined />
      </Tooltip>
    </Space>
  )
}

export default DatasetActivityRadio
