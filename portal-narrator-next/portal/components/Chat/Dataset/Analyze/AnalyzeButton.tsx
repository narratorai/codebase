import { Button, Spin, Tooltip } from 'antd-next'

interface Props {
  tooltipMessage: string | null
  loading: boolean
  disabled: boolean
  onClick: () => void
}

const AnalyzeButton = ({ tooltipMessage, loading, disabled, onClick }: Props) => (
  <Tooltip title={tooltipMessage}>
    <Spin spinning={loading}>
      <Button disabled={disabled} onClick={onClick}>
        Analyze
      </Button>
    </Spin>
  </Tooltip>
)

export default AnalyzeButton
