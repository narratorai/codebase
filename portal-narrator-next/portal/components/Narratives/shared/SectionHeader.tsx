import { Typography } from 'components/shared/jawns'
import { semiBoldWeight } from 'util/constants'

interface Props {
  title?: string
}

const SectionHeader = ({ title }: Props) => {
  return (
    <Typography
      className="section-header"
      mb={2}
      type="title100"
      color="gray700"
      fontWeight={semiBoldWeight}
      data-test="narrative-section-title-preview"
    >
      {title}
    </Typography>
  )
}

export default SectionHeader
