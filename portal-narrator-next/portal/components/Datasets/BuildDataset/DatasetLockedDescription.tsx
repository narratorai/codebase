import { Box, Typography } from 'components/shared/jawns'

const DatasetLockedDescription = () => {
  return (
    <Box>
      <Typography mb={1}>Dataset was locked to stop you from overriding the dataset.</Typography>
      <Typography>To unlock:</Typography>
      <Box ml={3}>
        <Typography>{`1) Go to "Edit Properties"`}</Typography>
        <Typography>{`2) Toggle "Lock Dataset" in Advanced Options`}</Typography>
      </Box>
    </Box>
  )
}

export default DatasetLockedDescription
