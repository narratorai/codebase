import { LinkOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd-next'
import { Flex, Link, Typography } from 'components/shared/jawns'
import { colors } from 'util/constants'

const Value = ({ text, fontSize, datasetLink }: { text: string; fontSize: string; datasetLink?: string }) => {
  return (
    <Flex alignItems="baseline">
      <Typography title={text} className="value" style={{ fontSize }} data-test="metric-graphic-value">
        {text}
      </Typography>

      {datasetLink && (
        <Link href={datasetLink} target="_blank">
          <Tooltip title="View source dataset">
            <LinkOutlined className="icon" style={{ color: colors.gray600 }} />
          </Tooltip>
        </Link>
      )}
    </Flex>
  )
}

export default Value
