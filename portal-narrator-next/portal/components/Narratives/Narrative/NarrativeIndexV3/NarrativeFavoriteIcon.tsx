import { HeartOutlined, HeartTwoTone } from '@ant-design/icons'
import { Tooltip } from 'antd-next'
import styled from 'styled-components'
import { PINK_HEART_COLOR } from 'util/constants'
import useFavoriteNarrative from 'util/narratives/useFavoriteNarrative'

import { NarrativeType } from './interfaces'

const HoverContainer = styled.div`
  &:hover {
    cursor: pointer;
  }
`

interface Props {
  narrative: NarrativeType
  onSuccess?: () => void
}

const NarrativeFavoriteIcon = ({ narrative, onSuccess }: Props) => {
  const [toggleFavorite, { isFavorited }] = useFavoriteNarrative({
    narrative,
    onToggleSuccess: onSuccess,
  })

  return (
    <HoverContainer onClick={toggleFavorite}>
      {isFavorited ? (
        <Tooltip title="Unfavorite narrative">
          <HeartTwoTone twoToneColor={PINK_HEART_COLOR} />
        </Tooltip>
      ) : (
        <Tooltip title="Favorite narrative">
          <HeartOutlined />
        </Tooltip>
      )}
    </HoverContainer>
  )
}

export default NarrativeFavoriteIcon
