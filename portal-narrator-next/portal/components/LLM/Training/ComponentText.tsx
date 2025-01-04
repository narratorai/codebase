import { Flex, Typography } from 'components/shared/jawns'
import { semiBoldWeight } from 'util/constants'

interface Props {
  title: string
  text?: string
}

const ComponentText = ({ title, text }: Props) => {
  return (
    <Flex alignItems="baseline" mb={1}>
      <Typography type="title400" fontWeight={semiBoldWeight} mr={1}>
        {title}:
      </Typography>
      <Typography>{text || 'None'}</Typography>
    </Flex>
  )
}

export default ComponentText
