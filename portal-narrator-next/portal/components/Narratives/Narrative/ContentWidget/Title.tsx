import { Typography } from 'components/shared/jawns'
import { semiBoldWeight } from 'util/constants'

const Title = ({ text, textType }: { text?: string; textType: string }) => {
  return (
    <Typography
      className="title truncated line-clamp-2"
      type={textType}
      title={text}
      fontWeight={semiBoldWeight}
      data-test="metric-graphic-title"
    >
      {text ?? <wbr />}
    </Typography>
  )
}

export default Title
