import { Box, Typography } from 'components/shared/jawns'

const CameFromNarrativeDescription = () => {
  return (
    <Box>
      <Typography mb={1}>You came from a narrative with filters.</Typography>
      <Typography>Updating this dataset will break the narrative.</Typography>
      <Typography>To update this dataset, please access via the dataset index page.</Typography>
    </Box>
  )
}

export default CameFromNarrativeDescription
