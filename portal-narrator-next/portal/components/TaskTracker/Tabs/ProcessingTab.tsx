import { Button, Empty } from 'antd-next'
import { Box, Link, Typography } from 'components/shared/jawns'
import { BasicTabProps } from 'components/TaskTracker/interfaces'
import SimpleTaskPlot from 'components/TaskTracker/Plots/SimpleTaskPlot'
import TaskExecutionPlot from 'components/TaskTracker/Plots/TaskExecutionPlot'
import ProcessingTasks from 'components/TaskTracker/ProcessingTasks'
import { TASK_CATEGORY_PROCESSING } from 'components/TaskTracker/services/constants'
import { isEmpty } from 'lodash'

import TabWrapper from './TabWrapper'

const ProcessingTab = ({ tasks }: BasicTabProps) => {
  return (
    <TabWrapper>
      <TaskExecutionPlot taskType={TASK_CATEGORY_PROCESSING} tasks={tasks} tabTitle="Processing" />

      {isEmpty(tasks) && (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}>
          <Link to="/manage/warehouse">
            <Button type="primary">Connect your warehouse</Button>
          </Link>
        </Empty>
      )}

      <Box>
        <Typography mb={2} type="title400">{`Total Processing (${tasks?.length || 0})`}</Typography>

        <Box pb={3}>
          <ProcessingTasks tasks={tasks} />
        </Box>
      </Box>

      <Box p={3} mb={2}>
        <SimpleTaskPlot plotSlug="transformation_updates" />
      </Box>

      <Box p={3} mb={2}>
        <SimpleTaskPlot plotSlug="transformation_duration" />
      </Box>
    </TabWrapper>
  )
}

export default ProcessingTab
