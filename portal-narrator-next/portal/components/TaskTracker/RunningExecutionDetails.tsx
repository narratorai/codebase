import { Alert, Collapse } from 'antd-next'
import { Box, Typography } from 'components/shared/jawns'
import SQLText from 'components/shared/SQLText'
import { FC } from 'react'
import styled from 'styled-components'
import { numberOfTimeAgo } from 'util/helpers'

// remove left padding from collapse
const CollapseContainer = styled(Box)`
  .antd5-collapse-header,
  .antd5-collapse-content-box {
    padding-left: 0 !important;
  }
`

const getInfoText = (minutesAgo: number): string | null => {
  // if execution's been running for 15-30 minutes
  if (minutesAgo >= 15 && minutesAgo < 30) {
    return `Processing is running smoothly, last query started ${minutesAgo} minutes ago.`
  }

  // if exection's been running for 30-45 minutes
  if (minutesAgo >= 30 && minutesAgo < 45) {
    return `Processing is running but queries seem to be TAKING some time. Last query started ${minutesAgo} minutes ago.`
  }

  // if execution's been running for more than 45 minutes
  if (minutesAgo >= 45) {
    return `Processing has stalled due to a long-running query. Last query started ${minutesAgo} minutes ago. Please contact support if this runtime duration is unexpected given your warehouse capacity.`
  }

  // under 15 minutes don't show anything
  return null
}

interface Props {
  ranAt: string // always utc time
  runningQuery?: string
}

const RunningExecutionDetails: FC<Props> = ({ ranAt, runningQuery }) => {
  const minutesAgo = numberOfTimeAgo(ranAt, 'minutes')
  const infoText = getInfoText(minutesAgo)
  const panelHeader = `Current Query (Running for ${minutesAgo} minutes)`

  return (
    <Box mt={1}>
      <Alert
        type="info"
        message={
          <Box>
            <Typography>{infoText}</Typography>

            {runningQuery && (
              <CollapseContainer>
                <Collapse ghost size="small">
                  <Collapse.Panel key="running-query" header={panelHeader}>
                    <SQLText value={runningQuery} copyButton={false} defaultHeight={560} />
                  </Collapse.Panel>
                </Collapse>
              </CollapseContainer>
            )}
          </Box>
        }
      />
    </Box>
  )
}

export default RunningExecutionDetails
