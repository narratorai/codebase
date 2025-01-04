import { CaretRightOutlined, RedoOutlined } from '@ant-design/icons'
import { Button, Tooltip } from 'antd-next'
import { Box, Flex } from 'components/shared/jawns'
import { colors } from 'util/constants'

interface Props {
  compiling: boolean
  handleRunCompile: () => void
  handleRefreshOptions: () => void
}

const CompileRefreshCtas = ({ compiling, handleRunCompile, handleRefreshOptions }: Props) => {
  return (
    <Flex>
      <Box mr={1}>
        <Tooltip title="Refresh input options">
          <Button onClick={handleRefreshOptions} icon={<RedoOutlined />} size="small" />
        </Tooltip>
      </Box>

      <Tooltip title="Recompile Content">
        <Button
          onClick={handleRunCompile}
          loading={compiling}
          disabled={compiling}
          icon={<CaretRightOutlined style={{ color: colors.green500 }} />}
          size="small"
        />
      </Tooltip>
    </Flex>
  )
}

export default CompileRefreshCtas
