import { Box, Typography } from 'components/shared/jawns'

const NoAggTableText = () => {
  return (
    <Box>
      <Typography type="title300" mb={2}>
        No Aggregation Table available
      </Typography>
      <Typography type="title400">
        Please see{' '}
        <a href="https://docs.narrator.ai/docs/spend-transformations" target="_blank" rel="noreferrer">
          our docs
        </a>{' '}
        on how to create an aggregation table.
      </Typography>
    </Box>
  )
}

export default NoAggTableText
