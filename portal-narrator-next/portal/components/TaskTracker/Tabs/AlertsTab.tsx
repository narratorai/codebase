import { Box, Typography } from 'components/shared/jawns'
import { BasicTabProps } from 'components/TaskTracker/interfaces'
import TaskExecutionPlot from 'components/TaskTracker/Plots/TaskExecutionPlot'
import { TASK_CATEGORY_ALERTS } from 'components/TaskTracker/services/constants'
import TaskCard from 'components/TaskTracker/TaskCard'
import { map } from 'lodash'

import TabWrapper from './TabWrapper'

const AlertsTab = ({ tasks }: BasicTabProps) => {
  return (
    <TabWrapper>
      <TaskExecutionPlot taskType={TASK_CATEGORY_ALERTS} tasks={tasks} tabTitle="Alerts" />
      <Box>
        <Typography mb={2} type="title400">{`Total Alerts (${tasks?.length || 0})`}</Typography>

        {map(tasks, (task) => (
          <TaskCard task={task} key={task.task_slug} />
        ))}
      </Box>
    </TabWrapper>
  )
}

export default AlertsTab
