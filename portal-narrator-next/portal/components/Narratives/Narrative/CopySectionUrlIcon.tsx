import { LinkOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd-next'
import { colors } from 'util/constants'

const CopySectionUrlIcon = () => {
  return (
    <Tooltip title="Copy section URL">
      <LinkOutlined
        className="icon"
        style={{
          color: colors.black,
          position: 'absolute',
          left: -25,
          top: 12,
        }}
      />
    </Tooltip>
  )
}

export default CopySectionUrlIcon
