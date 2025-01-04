import { Box, Typography } from 'components/shared/jawns'
import { BasicTabProps } from 'components/TaskTracker/interfaces'
import TaskExecutionPlot from 'components/TaskTracker/Plots/TaskExecutionPlot'
import { TASK_CATEGORY_MATERIALIZATIONS } from 'components/TaskTracker/services/constants'
import SortedIntegrations from 'components/TaskTracker/SortedIntegrations'

import TabWrapper from './TabWrapper'

const IntegrationsTab = ({ tasks }: BasicTabProps) => {
  return (
    <TabWrapper>
      <TaskExecutionPlot taskType={TASK_CATEGORY_MATERIALIZATIONS} tasks={tasks} tabTitle="Integrations" />

      <Box>
        <Typography mb={2} type="title400">{`Total Integrations (${tasks?.length || 0})`}</Typography>
        <SortedIntegrations tasks={tasks} />
      </Box>
    </TabWrapper>
  )
}

export default IntegrationsTab
