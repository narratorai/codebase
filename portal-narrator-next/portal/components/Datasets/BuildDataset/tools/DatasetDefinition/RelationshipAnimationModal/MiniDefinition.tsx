import { antdOverrides } from '@narratorai/theme'
import { Box, Flex, Typography } from 'components/shared/jawns'
import styled from 'styled-components'

import ActivityPuzzlePiece from './ActivityPuzzlePiece'

interface Props {
  appendActivityName: string
  cohortActivityName: string
  occurrenceLabel: string
  relationshipLabel: string
}

const MockInput = styled(Flex)`
  justify-content: center;
  border-radius: 4px;
  padding: 3px 8px;

  /* match input border: */
  border: 1px solid ${antdOverrides['@normal-color']};
`

const MiniDefinition = ({ appendActivityName, cohortActivityName, occurrenceLabel, relationshipLabel }: Props) => {
  return (
    <Flex mb={3} justifyContent="center">
      <Box>
        <Flex alignItems="center" mb={2}>
          <Box mr={1}>
            <Typography type="body50" fontWeight="bold">
              Give me
            </Typography>
          </Box>
          <MockInput mr={1}>
            <Typography>{occurrenceLabel}</Typography>
          </MockInput>
          <Box mr={1}>
            <ActivityPuzzlePiece name={cohortActivityName} type="cohort" />
          </Box>
          <Typography type="body50" fontWeight="bold">
            activities…
          </Typography>
        </Flex>
        <Flex alignItems="center" pl={1}>
          <Box mr={1}>
            <Typography type="body100" fontWeight="bold">
              Join
            </Typography>
          </Box>
          <MockInput mr={1}>
            <Typography>{relationshipLabel}</Typography>
          </MockInput>
          <Box>
            <ActivityPuzzlePiece name={appendActivityName} type="append" />
          </Box>
        </Flex>
      </Box>
    </Flex>
  )
}

export default MiniDefinition
