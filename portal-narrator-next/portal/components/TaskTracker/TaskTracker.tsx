import { App, Spin, Tabs } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { Box } from 'components/shared/jawns'
import Page from 'components/shared/Page'
import { PlotTimes } from 'components/TaskTracker/interfaces'
import MonitorProcessingToggle from 'components/TaskTracker/MonitorProcessingToggle'
import AlertsTab from 'components/TaskTracker/Tabs/AlertsTab'
import IntegrationsTab from 'components/TaskTracker/Tabs/IntegrationsTab'
import NarrativesTab from 'components/TaskTracker/Tabs/NarrativesTab'
import ProcessingTab from 'components/TaskTracker/Tabs/ProcessingTab'
import TaskTrackerContext from 'components/TaskTracker/TaskTrackerContext'
import {
  ICompany_Task,
  IWatcher_Relation_Enum,
  useGetCompanyBatchHaltSubscription,
  useListWatchersQuery,
  useTaskTrackerNeedsUpdateSubscription,
  useTaskTrackerQuery,
} from 'graph/generated'
import { clone, filter, findIndex, get, includes, isEmpty, orderBy, startCase } from 'lodash'
import queryString from 'query-string'
import { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import styled from 'styled-components'

import {
  RUN_TRANSFORMATIONS_SLUG,
  TASK_CATEGORY_ALERTS,
  TASK_CATEGORY_MATERIALIZATIONS,
  TASK_CATEGORY_NARRATIVES,
  TASK_CATEGORY_PROCESSING,
} from './services/constants'

// hide overflow (stops left side tabs from scrolling)
// (see <TabWrapper /> for allowing scroll in tab content)
const StyledTabsContainer = styled(Box)`
  position: relative;
  overflow-y: hidden;
  height: 100vh;
  padding-top: 24px;

  .antd5-tabs-nav {
    height: 100vh;
  }
`

const StyledMonitoringContainer = styled(Box)`
  position: absolute;
  left: 24px;
  bottom: 60px;

  @media (height <= 560px) {
    bottom: 0;
    top: 240px;
  }
`

const ALL_TABS = [
  TASK_CATEGORY_PROCESSING,
  TASK_CATEGORY_MATERIALIZATIONS,
  TASK_CATEGORY_NARRATIVES,
  TASK_CATEGORY_ALERTS,
]

const TaskTracker = () => {
  const { notification } = App.useApp()
  const company = useCompany()
  const history = useHistory()
  const { user } = useUser()
  const query = queryString.parse(history.location.search)
  const tabCategoryFromQuery = query.category as string

  // All plots have the same time range
  const [duration, setDuration] = useState(3)
  const [resolution, setResolution] = useState('day')
  const [plotTime, setPlotTime] = useState<PlotTimes>('user_time')

  const handleUpdateDurationResolution = ({ duration, resolution }: { duration: number; resolution: string }) => {
    setDuration(duration)
    setResolution(resolution)
  }

  const [tabKey, setTabKey] = useState(tabCategoryFromQuery || TASK_CATEGORY_PROCESSING)

  // if the tabCategoryFromQuery doesn't match the tabQuery - update tabQuery
  // (this can happen when hitting back/forward after clicking mulitple tabs)
  useEffect(() => {
    // processing doesn't have query param on load
    if (!tabCategoryFromQuery && tabKey !== TASK_CATEGORY_PROCESSING) {
      setTabKey(TASK_CATEGORY_PROCESSING)
      return
    }

    if (tabCategoryFromQuery && includes(ALL_TABS, tabCategoryFromQuery) && tabCategoryFromQuery !== tabKey) {
      setTabKey(tabCategoryFromQuery)
    }
  }, [tabCategoryFromQuery, tabKey, setTabKey])

  const handleTabChange = (key: string) => {
    // add query params here
    const updatedQuery = queryString.stringify({
      ...query,
      category: key,
    })

    history.push({
      pathname: history.location.pathname,
      search: updatedQuery,
    })
    setTabKey(key)
  }

  const { data: batchHaltedData } = useGetCompanyBatchHaltSubscription({
    variables: { id: company?.id },
  })

  const processingIsPaused = !!batchHaltedData?.company[0]?.batch_halt

  const {
    data: tasksData,
    loading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks,
  } = useTaskTrackerQuery({
    variables: { company_slug: company.slug },
  })

  const handleRefetchTasks = () => {
    // only refetch if the query has run at least once
    // (don't want to fire on initial return of useTaskTrackerNeedsUpdateSubscription)
    if (!isEmpty(tasksData)) {
      refetchTasks()
    }
  }

  useTaskTrackerNeedsUpdateSubscription({
    variables: { company_slug: company.slug },
    onData: handleRefetchTasks,
  })

  useEffect(() => {
    if (tasksError) {
      notification.error({
        key: 'get-tasks-error',
        message: 'There was an error getting your tasks',
        description: tasksError?.message,
        duration: null,
        placement: 'topRight',
      })
    }
  }, [tasksError, notification])

  // Grab all watchers so refetch will be consistent with Notifications page
  // - if you just grabbed watchers by company tasks, the Notifications page would not be updated
  // - when going from Processing -> Notifications
  const { data: watcherData, refetch: refetchWatchers } = useListWatchersQuery({
    variables: { user_id: user?.id },
  })

  // Filter to only have CompanyTask watchers
  const taskWatchers = filter(
    watcherData?.watcher,
    (watcher) => watcher?.related_to === IWatcher_Relation_Enum.CompanyTask
  )

  const tasks = get(tasksData, 'company_task')

  const showableTasks = filter(tasks, ['category', tabKey])
  let sortedShowableTasks: ICompany_Task[] = []
  if (!isEmpty(showableTasks)) {
    if (tabKey === TASK_CATEGORY_PROCESSING) {
      // if on processing tab
      // make sure run transformations is at the top of processing tasks
      const runTransformationsIdx = findIndex(showableTasks, { task_slug: RUN_TRANSFORMATIONS_SLUG })
      const runTransformations = showableTasks![runTransformationsIdx]

      // Now remove run transformations to get the rest of the tasks
      const tasksCopy = clone(showableTasks)
      tasksCopy?.splice(runTransformationsIdx, 1)
      const orderedTasks = orderBy(tasksCopy, 'created_at', 'desc')
      sortedShowableTasks = [runTransformations, ...orderedTasks] as ICompany_Task[]
    } else {
      // if not on processing tab
      sortedShowableTasks = orderBy(showableTasks, 'created_at', 'desc') as ICompany_Task[]
    }
  }

  const tabItems = ALL_TABS.map((tab) => {
    if (tab === TASK_CATEGORY_PROCESSING) {
      return {
        key: tab,
        label: 'Processing',
        children: <ProcessingTab tasks={sortedShowableTasks as ICompany_Task[]} />,
      }
    }

    if (tab === TASK_CATEGORY_MATERIALIZATIONS) {
      return {
        key: tab,
        label: 'Integrations',
        children: <IntegrationsTab tasks={sortedShowableTasks as ICompany_Task[]} />,
      }
    }

    if (tab === TASK_CATEGORY_NARRATIVES) {
      return {
        key: tab,
        label: 'Analyses and Dashboards',
        children: <NarrativesTab tasks={sortedShowableTasks as ICompany_Task[]} />,
      }
    }

    if (tab === TASK_CATEGORY_ALERTS) {
      return {
        key: tab,
        label: 'Alerts',
        children: <AlertsTab tasks={sortedShowableTasks as ICompany_Task[]} />,
      }
    }

    // fallback - should never get here
    return {
      key: tab,
      label: startCase(tab),
    }
  })

  return (
    <Page title="Processing | Narrator" breadcrumbs={[{ text: 'Processing' }]} bg="white" hasSider={false}>
      <TaskTrackerContext.Provider
        value={{
          resolution,
          duration,
          handleUpdateDurationResolution,
          plotTime,
          setPlotTime,
          taskWatchers,
          refetchWatchers,
          processingIsPaused,
        }}
      >
        <Spin spinning={tasksLoading}>
          <StyledTabsContainer>
            <Tabs
              onChange={handleTabChange}
              activeKey={tabKey}
              items={tabItems}
              tabPosition="left"
              tabBarExtraContent={
                <StyledMonitoringContainer>
                  <MonitorProcessingToggle />
                </StyledMonitoringContainer>
              }
            />
          </StyledTabsContainer>
        </Spin>
      </TaskTrackerContext.Provider>
    </Page>
  )
}

export default TaskTracker
