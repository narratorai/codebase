import { Box, Typography } from 'components/shared/jawns'
import { BasicTabProps } from 'components/TaskTracker/interfaces'
import NarrativeDashboardTasks from 'components/TaskTracker/NarrativeDashboardTasks'
import TaskExecutionPlot from 'components/TaskTracker/Plots/TaskExecutionPlot'
import { TASK_CATEGORY_NARRATIVES } from 'components/TaskTracker/services/constants'

import TabWrapper from './TabWrapper'

const NarrativesTab = ({ tasks }: BasicTabProps) => {
  return (
    <TabWrapper>
      <TaskExecutionPlot taskType={TASK_CATEGORY_NARRATIVES} tasks={tasks} tabTitle="Analyses and Dashboards" />

      <Box>
        <Typography mb={2} type="title400">{`Total Analyses and Dashboards (${tasks?.length || 0})`}</Typography>

        <NarrativeDashboardTasks tasks={tasks} />
      </Box>
    </TabWrapper>
  )
}

export default NarrativesTab
