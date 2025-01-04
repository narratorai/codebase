import { HeartOutlined, HeartTwoTone } from '@ant-design/icons'
import { Box } from 'components/shared/jawns'
import styled from 'styled-components'
import { PINK_HEART_COLOR } from 'util/constants'

const GrowOnHover = styled(Box)`
  transition: all 0.15s ease-in-out;

  :hover {
    transform: scale(1.1);
    cursor: pointer;
  }
`

interface Props {
  isFavorite: boolean
  onClick: () => void
}

const FavoriteIcon = ({ isFavorite, onClick }: Props) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick?.()
  }

  return (
    <GrowOnHover onClick={handleClick}>
      {isFavorite ? <HeartTwoTone twoToneColor={PINK_HEART_COLOR} /> : <HeartOutlined />}
    </GrowOnHover>
  )
}

export default FavoriteIcon
