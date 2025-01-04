import { Typography } from 'components/shared/jawns'
import { lightWeight } from 'util/constants'

const Description = ({ text }: { text?: string }) => {
  return (
    <Typography
      className="truncated line-clamp-2"
      type="body100"
      title={text && text.length > 20 ? text : undefined}
      fontWeight={lightWeight}
      mb={2}
    >
      {text ?? <wbr />}
    </Typography>
  )
}

export default Description
