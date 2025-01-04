import { InfoCircleOutlined } from '@ant-design/icons'
import { Space, Tooltip } from 'antd-next'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { colors, semiBoldWeight } from 'util/constants'

interface Props {
  title: string
  description: string
  color: string
  disabled?: boolean
  renderCTAOverride?: ({ disabled }: { disabled?: boolean }) => React.ReactNode
}

const TitleRow = ({ color, description, disabled = false, renderCTAOverride, title }: Props) => {
  return (
    <Flex
      justifyContent="space-between"
      pt={1}
      px={2}
      bg={disabled ? 'gray300' : 'white'}
      style={{ opacity: disabled ? 0.5 : 1 }}
      alignItems="center"
    >
      <Box mr={2} data-public>
        <Space>
          <Typography color={color} type="body300" css={{ letterSpacing: '0.5px' }} fontWeight={semiBoldWeight}>
            {title}
          </Typography>

          {description && (
            <Tooltip title={description}>
              <InfoCircleOutlined className="title-info" style={{ color: colors[color] }} />
            </Tooltip>
          )}
        </Space>
      </Box>

      <Box>{renderCTAOverride && renderCTAOverride({ disabled })}</Box>
    </Flex>
  )
}

export default TitleRow
