import { Tooltip } from 'antd-next'
import { Link } from 'components/shared/jawns'

interface Props {
  href?: string
  onClick?: () => void
  color?: string
  tooltip?: string
  children: React.ReactNode
}

const FeedbackButton = ({ href, onClick, color, tooltip, children }: Props) => (
  <Tooltip title={tooltip}>
    <Link
      to={href}
      target={href ? '_blank' : '_self'}
      onClick={onClick}
      style={{
        height: '24px',
        width: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color,
      }}
    >
      {children}
    </Link>
  </Tooltip>
)

export default FeedbackButton
