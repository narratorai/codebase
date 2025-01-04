import { Collapse } from 'antd-next'
import { ICompany_Task } from 'graph/generated'
import _ from 'lodash'
import React, { useCallback, useMemo, useState } from 'react'

import { RUN_TRANSFORMATIONS_SLUG } from './services/constants'
import TaskCard from './TaskCard'

interface Props {
  tasks?: ICompany_Task[]
}

const PROCESSING_KEY = 'processing'
const MAINTENANCE_KEY = 'maintenance'
const SUPER_ADMIN_KEY = 'super'
const OTHER_KEY = 'other'
const ALL_COLLAPSE_KEYS = [PROCESSING_KEY, MAINTENANCE_KEY, SUPER_ADMIN_KEY, OTHER_KEY]

// processing slugs should be presented in this order too
const DATA_PROCESSING_SLUGS = [RUN_TRANSFORMATIONS_SLUG, 'run_async_transformations', 'reconcile_stream_processing']

const DATA_MAINTENANCE_SLUGS = [
  'run_data_diagnostics',
  'vacuum_tables',
  'compute_column_summaries',
  'check_new_activities',
]

const ProcessingTasks: React.FC<Props> = ({ tasks }) => {
  const [openPanelKeys, setOpenPanelKeys] = useState<string[]>(ALL_COLLAPSE_KEYS)

  const handleSetOpenPanelKeys = useCallback((keys: string[] | string) => {
    if (_.isString(keys)) {
      return setOpenPanelKeys([keys])
    }

    setOpenPanelKeys(keys)
  }, [])

  const dataProcessingTasks: ICompany_Task[] = useMemo(() => {
    // ensure order of processing tasks
    const orderedProcessingTasks: ICompany_Task[] = []

    // by looping through the ordered slugs
    _.each(DATA_PROCESSING_SLUGS, (taskSlug) => {
      const foundTask = _.find(tasks, ['task_slug', taskSlug])

      if (foundTask) {
        orderedProcessingTasks.push(foundTask)
      }
    })

    return orderedProcessingTasks
  }, [tasks])

  const dataMaintenanceTasks: ICompany_Task[] = useMemo(() => {
    return _.filter(tasks, (task) => _.includes(DATA_MAINTENANCE_SLUGS, task.task_slug))
  }, [tasks])

  const superAdminOnlyTasks: ICompany_Task[] = useMemo(() => {
    return _.filter(tasks, (task) => task.internal_only)
  }, [tasks])

  // may never happen, but check if there are any tasks that weren't discovered above
  const otherTasks: ICompany_Task[] = useMemo(() => {
    const allCategorizedTasks = [...dataProcessingTasks, ...dataMaintenanceTasks, ...superAdminOnlyTasks]

    // don't bother checking if categorized tasks is the same length as all the tasks
    if (allCategorizedTasks?.length === tasks?.length) {
      return []
    }

    // there is a mismatch in categorized tasks and total tasks
    // so find all uncategorized tasks ('other')
    return _.filter(tasks, (task) => !_.find(allCategorizedTasks, ['id', task.id]))
  }, [dataProcessingTasks, dataMaintenanceTasks, superAdminOnlyTasks, tasks])

  return (
    <Collapse activeKey={openPanelKeys} onChange={handleSetOpenPanelKeys}>
      {/* Data Processing */}
      {!_.isEmpty(dataProcessingTasks) && (
        <Collapse.Panel key={PROCESSING_KEY} header="Data Processing">
          {_.map(dataProcessingTasks, (task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </Collapse.Panel>
      )}

      {/* Data Maintenance */}
      {!_.isEmpty(dataMaintenanceTasks) && (
        <Collapse.Panel key={MAINTENANCE_KEY} header="Data Maintenance">
          {_.map(dataMaintenanceTasks, (task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </Collapse.Panel>
      )}

      {/* Super Admin Only */}
      {!_.isEmpty(superAdminOnlyTasks) && (
        <Collapse.Panel key={SUPER_ADMIN_KEY} header="Super Admin">
          {_.map(superAdminOnlyTasks, (task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </Collapse.Panel>
      )}

      {/* Other */}
      {!_.isEmpty(otherTasks) && (
        <Collapse.Panel key={OTHER_KEY} header="Other">
          {_.map(otherTasks, (task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </Collapse.Panel>
      )}
    </Collapse>
  )
}

export default ProcessingTasks
