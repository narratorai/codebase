import { Box } from 'components/shared/jawns'
import { ICompany_Task, IDataset_Materialization } from 'graph/generated'
import { find, map } from 'lodash'

import TaskCard from './TaskCard'

interface TaskGroupProps {
  materializations: IDataset_Materialization[]
  tasks?: ICompany_Task[]
}

const TaskGroup = ({ materializations, tasks }: TaskGroupProps) => {
  return (
    <Box>
      {map(materializations, (integration) => {
        const task = find(tasks, ['id', integration.task_id]) as ICompany_Task
        return <TaskCard task={task} key={integration.id} />
      })}
    </Box>
  )
}

export default TaskGroup
