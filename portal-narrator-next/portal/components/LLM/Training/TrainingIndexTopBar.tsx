import { Flex, Typography } from 'components/shared/jawns'

import { TRAINING_HEADER_Z_INDEX, TRAINING_INDEX_TOP_BAR_HEIGHT } from './constants'

const TrainingIndexTopBar = () => {
  return (
    <Flex
      alignItems="center"
      justifyContent="space-between"
      style={{ position: 'sticky', top: 0, height: TRAINING_INDEX_TOP_BAR_HEIGHT, zIndex: TRAINING_HEADER_Z_INDEX }}
    >
      <Typography type="title300">Trainings</Typography>
    </Flex>
  )
}

export default TrainingIndexTopBar
