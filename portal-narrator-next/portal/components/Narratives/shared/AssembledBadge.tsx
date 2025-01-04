import { Badge, Popover } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { NarrativeType } from 'components/Narratives/Narrative/NarrativeIndexV3/interfaces'
import { Box, Typography } from 'components/shared/jawns'
import cronstrue from 'cronstrue'
import { INarrative } from 'graph/generated'
import styled from 'styled-components'
import { handleApproximateCron, nextTimeFromCron, timeFromNow, withinWeekAgo } from 'util/helpers'

const LeftTableData = styled.td`
  text-align: right;
`

interface Props {
  narrative: INarrative | NarrativeType
}

const getStatus = (narrative: INarrative | NarrativeType) => {
  // if it is not scheduled to run return default (gray)
  if (!narrative.company_task?.schedule) {
    return 'default'
  }

  // otherwise check the last assembled date
  const lastAssembled = narrative?.narrative_runs[0]?.created_at
  const recentlyRun = withinWeekAgo(lastAssembled)

  // if it is within a week return success (green)
  if (recentlyRun) {
    return 'success'
  }

  // otherwise it's over a week ago and return warning (yellow)
  return 'warning'
}

const AssembledBadge = ({ narrative }: Props) => {
  const company = useCompany()
  const lastAssembled = narrative?.narrative_runs[0]?.created_at

  const status = getStatus(narrative)

  const cronSchedule = narrative.company_task?.schedule
  const isScheduledToRun = !!cronSchedule

  const formattedCron = isScheduledToRun ? handleApproximateCron(cronSchedule) : undefined
  const formattedCronTab = formattedCron?.formattedCronTab
  const formattedCronText = isScheduledToRun ? cronstrue.toString(formattedCronTab) : undefined

  return (
    <Popover
      placement="top"
      content={
        <Box>
          {!isScheduledToRun && <Typography>Not Scheduled</Typography>}

          <table>
            {isScheduledToRun && (
              <tr>
                <LeftTableData>
                  <Typography mr={1}>Scheduled:</Typography>
                </LeftTableData>
                <td>{formattedCronText}</td>
              </tr>
            )}
            <tr>
              <LeftTableData>
                <Typography mr={1}>{lastAssembled ? 'Last run: ' : 'Has no runs'}</Typography>
              </LeftTableData>
              <td>{lastAssembled ? timeFromNow(lastAssembled) : ' '}</td>
            </tr>
            <tr>
              <LeftTableData>
                <Typography mr={1}>{isScheduledToRun ? 'Next run: ' : ' '}</Typography>
              </LeftTableData>
              <td>
                {isScheduledToRun
                  ? nextTimeFromCron(narrative?.company_task?.schedule, company?.timezone, lastAssembled)
                  : ' '}
              </td>
            </tr>
          </table>
        </Box>
      }
    >
      <Badge status={status} />
    </Popover>
  )
}

export default AssembledBadge
