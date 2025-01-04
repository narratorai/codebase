import { QuestionOutlined } from '@ant-design/icons'
import { Flex, Typography } from 'components/shared/jawns'
import styled from 'styled-components'
import { ATTRIBUTE_COLOR, BEHAVIOR_COLOR } from 'util/datasets'

import { IBaseActivityConfig } from './interfaces'

const PuzzlePiece = styled(({ noMaxWidth, highlighted, ignored, ...props }) => <Flex {...props} />)`
  position: relative;
  justify-content: center;
  max-width: ${({ noMaxWidth }) => (noMaxWidth ? 'inherit' : '200px')};
  border-radius: ${({ highlighted }) => (highlighted ? '2px' : '4px')};
  padding: 3px 8px;
  opacity: ${({ ignored }) => (ignored ? 0.5 : 1)};

  p {
    text-decoration: ${({ crossedOut }) => (crossedOut ? 'line-through' : 'inherit')};
  }

  ::before {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 4px;
    border: ${({ highlighted, theme }) => (highlighted ? `3px solid ${theme.colors.yellow500}` : 'none')};
  }
`

interface Props extends IBaseActivityConfig {
  name?: string
  noMaxWidth?: boolean
}

const ActivityPuzzlePiece = ({
  name,
  type,
  noMaxWidth = false,
  leftMargin = false,
  highlighted = false,
  ignored = false,
  crossedOut = false,
  value,
}: Props) => {
  const bgColor = type === 'cohort' ? BEHAVIOR_COLOR : type === 'append' ? ATTRIBUTE_COLOR : undefined

  return (
    <PuzzlePiece
      bg={bgColor}
      ml={leftMargin ? 4 : 0}
      mr={leftMargin ? -4 : 0}
      crossedOut={crossedOut}
      highlighted={highlighted}
      ignored={ignored}
      noMaxWidth={noMaxWidth}
    >
      {type === 'value' && <Typography>{value}</Typography>}

      {type === 'unknown' && (
        <div>
          <QuestionOutlined />
        </div>
      )}
      {type === 'null' && (
        <Typography>
          <i>NULL</i>
        </Typography>
      )}

      {/* If they haven't passed a name in (haven't selected an append/join activity example) */}
      {(type === 'append' || type === 'cohort') && !name && (
        <Typography color="white">
          <i>Sample Activity</i>
        </Typography>
      )}

      {(type === 'append' || type === 'cohort') && name && <Typography color="white">{name}</Typography>}
    </PuzzlePiece>
  )
}

export default ActivityPuzzlePiece
