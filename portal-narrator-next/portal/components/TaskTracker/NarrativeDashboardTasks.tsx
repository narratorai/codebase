import { Collapse } from 'antd-next'
import { ICompany_Task, INarrative_Types_Enum } from 'graph/generated'
import { filter, isString, map } from 'lodash'
import { useState } from 'react'

import TaskCard from './TaskCard'

const NARRATIVE_KEY = 'narrative'
const DASHBOARD_KEY = 'dashboard'
const ALL_COLLAPSE_KEYS = [NARRATIVE_KEY, DASHBOARD_KEY]

interface Props {
  tasks?: ICompany_Task[]
}

const NarrativeDashboardTasks = ({ tasks }: Props) => {
  const [openPanelKeys, setOpenPanelKeys] = useState<string[]>(ALL_COLLAPSE_KEYS)

  const handleSetOpenPanelKeys = (keys: string[] | string) => {
    if (isString(keys)) {
      return setOpenPanelKeys([keys])
    }

    setOpenPanelKeys(keys)
  }

  const narrativeTasks = filter(tasks, (task) => task?.narratives?.[0]?.type !== INarrative_Types_Enum.Dashboard)
  const dashboardTasks = filter(tasks, (task) => task?.narratives?.[0]?.type === INarrative_Types_Enum.Dashboard)

  return (
    <Collapse activeKey={openPanelKeys} onChange={handleSetOpenPanelKeys}>
      <Collapse.Panel key={NARRATIVE_KEY} header={`Analyses (${narrativeTasks.length})`}>
        {map(narrativeTasks, (task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </Collapse.Panel>

      <Collapse.Panel key={DASHBOARD_KEY} header={`Dashboards (${dashboardTasks.length})`}>
        {map(dashboardTasks, (task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </Collapse.Panel>
    </Collapse>
  )
}

export default NarrativeDashboardTasks
