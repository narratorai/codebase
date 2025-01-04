import React from 'react'
import _ from 'lodash'

import { Box, Typography } from 'components/shared/jawns'

const LineNotice = ({ plotExtras }) => {
  const totalLines = _.get(plotExtras, 'totalLines', 0)
  const renderedLines = _.get(plotExtras, 'renderedLines', 0)

  if (totalLines > renderedLines) {
    return (
      <Box mb="4px">
        <Typography type="body200">
          Rendering{' '}
          <b>
            {renderedLines} of {totalLines}
          </b>{' '}
          possible lines. Filter Dataset Group to show specific lines.
        </Typography>
      </Box>
    )
  }

  return null
}

export default LineNotice
