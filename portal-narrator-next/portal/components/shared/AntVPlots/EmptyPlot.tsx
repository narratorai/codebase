import { Empty } from 'antd-next'
import { Typography } from 'components/shared/jawns'

interface Props {
  plotTitle?: string
}

const EmptyPlot = ({ plotTitle }: Props) => {
  return (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <Typography>
          No plot data
          {!!plotTitle && ' for '}
          {!!plotTitle && <span style={{ fontWeight: 'bold' }}>{`${plotTitle}`}</span>} found
        </Typography>
      }
    />
  )
}

export default EmptyPlot
