import { DeleteOutlined, HistoryOutlined, InfoCircleOutlined, LinkOutlined, LockOutlined } from '@ant-design/icons'
import { BadgeProps } from 'antd/es/badge'
import { App, Badge, Card, Modal, Popconfirm, Popover, Spin, Tooltip } from 'antd-next'
import { ProtectedRoleButton } from 'components/context/auth/protectedComponents'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { Box, CronTranslation, Flex, Link, Typography } from 'components/shared/jawns'
import CronSelectFormItem from 'components/shared/jawns/forms/CronSelectFormItem'
import RunningExecutionDetails from 'components/TaskTracker/RunningExecutionDetails'
import TaskTrackerContext from 'components/TaskTracker/TaskTrackerContext'
import JobExecutionErrors from 'components/Transformations/JobExecutionErrors'
import {
  ICompany_Task,
  useCreateCompanyTaskWatcherMutation,
  useDeleteCompanyTaskWatcherMutation,
} from 'graph/generated'
import { find, get, isEmpty, isEqual, map, startCase, startsWith } from 'lodash'
import { useCallback, useContext, useEffect, useState } from 'react'
import { FiBell, FiBellOff } from 'react-icons/fi'
import styled from 'styled-components'
import analytics from 'util/analytics'
import { colors } from 'util/constants'
import { cronValidator } from 'util/forms'
import { nextTimeFromCron, timeFromNow } from 'util/helpers'
import { handleMavisErrorNotification, useLazyCallMavis } from 'util/useCallMavis'
import usePrevious from 'util/usePrevious'

import RunTransformationsWarning from './RunTransformationsWarning'
import {
  TASK_CATEGORY_ALERTS,
  TASK_CATEGORY_MATERIALIZATIONS,
  TASK_CATEGORY_NARRATIVES,
  TASK_CATEGORY_PROCESSING,
} from './services/constants'
import { getStatusColor, IHoneyCombLink, makeTaskExecutionHoneycombLinks, taskPrettyName } from './services/helpers'
import useCancelTaskExecution from './services/useCancelTaskExecution'
import useDeleteTask from './services/useDeleteTask'
import TaskOrExecutionTable from './TaskOrExecutionTable'

const IconContainer = styled(Box)`
  &:hover {
    cursor: pointer;
  }
`

interface Props {
  task: ICompany_Task
}

const TaskCard = ({ task }: Props) => {
  const { notification } = App.useApp()
  const { isCompanyAdmin, isSuperAdmin, user } = useUser()
  const company = useCompany()
  const { timezone } = company
  const { plotTime, taskWatchers: watchers, refetchWatchers, processingIsPaused } = useContext(TaskTrackerContext)

  const [hasClickedRunNow, setHasClickedRunNow] = useState(false)
  const [updateCron, setUpdateCron] = useState(task?.schedule || '')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showUpdateCronModal, setShowUpdateCronModal] = useState(false)

  const lastExecution = get(task, 'executions[0]', {})
  const prevExecution = usePrevious(lastExecution)
  const isSubscribed = !!find(watchers, ['related_id', task?.id])

  // This re runs the task - creating a new execution
  const [createExecution, { loading: createExecutionLoading }] = useLazyCallMavis<any>({
    method: 'POST',
    path: '/admin/v1/task/run',
    retryable: true,
  })

  // this deletes a company task (not processing tasks though)
  const toggleShowDeleteModal = useCallback(() => {
    setShowDeleteModal(!showDeleteModal)
  }, [setShowDeleteModal, showDeleteModal])

  const [deleteTask, { loading: deleteTaskLoading, error: deleteTaskError }] = useDeleteTask()

  const handleDeleteTask = () => {
    deleteTask(task.id)
  }

  // cancel running task executions
  const [
    cancelTaskExecution,
    { loading: cancelTaskExecutionLoading, error: cancelTaskExecutionError, canceled: canceledTaskExecution },
  ] = useCancelTaskExecution()
  const prevCanceledTaskExecution = usePrevious(canceledTaskExecution)

  const handleCancelTask = () => {
    cancelTaskExecution(lastExecution.id)
  }

  // This updates when a task is run automatically - updating it's cron schedule
  const toggleShowUpdateCronModal = useCallback(() => {
    setShowUpdateCronModal(!showUpdateCronModal)
  }, [showUpdateCronModal])

  // reset cron to task schedule on cancel
  const onCancelCronModal = () => {
    toggleShowUpdateCronModal()
    setUpdateCron(task?.schedule || '')
  }

  const [updateTaskSchedule, { loading: updateScheduleLoading, error: updateScheduleError }] = useLazyCallMavis<any>({
    method: 'POST',
    path: '/admin/v1/task/update_schedule',
    retryable: true,
  })

  const handleUpdateCron = () => {
    analytics.track('updated_task_schedule', {
      task_slug: task.task_slug,
      task_category: task.category,
      task_id: task.id,
      schedule: updateCron,
    })

    updateTaskSchedule({ body: { task_id: task.id, schedule: updateCron } })
  }

  // close update cron modal on update success
  const prevUpdateScheduleLoading = usePrevious(updateScheduleLoading)
  useEffect(() => {
    if (prevUpdateScheduleLoading && !updateScheduleLoading && !updateScheduleError) {
      toggleShowUpdateCronModal()
    }
  }, [prevUpdateScheduleLoading, updateScheduleLoading, updateScheduleError, toggleShowUpdateCronModal])

  const [createCompanyTaskWatcherMutation, { data: createWatcherData, error: createWatcherError }] =
    useCreateCompanyTaskWatcherMutation({
      variables: {
        user_id: user?.id,
        task_id: task?.id,
      },
    })

  const [deleteCompanyTaskWatcherMutation, { data: deleteWatcherData, error: deleteWatcherError }] =
    useDeleteCompanyTaskWatcherMutation({
      variables: {
        user_id: user?.id,
        task_id: task?.id,
      },
    })

  const toggleTaskSubscription = useCallback(() => {
    if (isSubscribed) {
      deleteCompanyTaskWatcherMutation()
    } else {
      createCompanyTaskWatcherMutation()
    }
  }, [createCompanyTaskWatcherMutation, deleteCompanyTaskWatcherMutation, isSubscribed])

  // error notifications for create/delete watchers
  useEffect(() => {
    if (createWatcherError) {
      notification.error({
        key: 'create_error_key',
        message: 'Error: Add Subscription',
        description: createWatcherError?.message,
        placement: 'topRight',
        duration: null,
      })
    }
  }, [createWatcherError, notification])

  useEffect(() => {
    if (deleteWatcherError) {
      notification.error({
        key: 'delete_error_key',
        message: 'Error: Delete Subscription',
        description: deleteWatcherError?.message,
        placement: 'topRight',
        duration: null,
      })
    }
  }, [deleteWatcherError, notification])

  // sucess notifications for create/delete watchers
  // and refetch watchers
  useEffect(() => {
    if (!isEmpty(createWatcherData)) {
      const taskSlug = createWatcherData?.insert_watcher?.returning[0]?.company_task?.task_slug
      notification.success({
        key: `create_success_key_${taskSlug}`,
        message: 'You have subscribed!',
        description: (
          <Typography>
            You will now receive emails on <span style={{ fontWeight: 'bold' }}>{startCase(taskSlug)}</span> failure.
          </Typography>
        ),
        placement: 'topRight',
        duration: 3,
      })

      if (refetchWatchers) {
        refetchWatchers({ user_id: user?.id })
      }
    }
  }, [createWatcherData, refetchWatchers, user, notification])

  useEffect(() => {
    if (!isEmpty(deleteWatcherData)) {
      const taskSlug = deleteWatcherData?.delete_watcher?.returning[0]?.company_task?.task_slug
      notification.info({
        key: `delete_success_key_${taskSlug}`,
        message: 'You have unsubscribed.',
        description: (
          <Typography>
            You will no longer receive emails on <span style={{ fontWeight: 'bold' }}>{startCase(taskSlug)}</span>{' '}
            failure.
          </Typography>
        ),
        placement: 'topRight',
        duration: 3,
      })

      if (refetchWatchers) {
        refetchWatchers({ user_id: user?.id })
      }
    }
  }, [deleteWatcherData, refetchWatchers, user, notification])

  // error notifications for cancel task execution
  useEffect(() => {
    if (cancelTaskExecutionError) {
      handleMavisErrorNotification({ error: cancelTaskExecutionError, notification })
    }
  }, [cancelTaskExecutionError, notification])

  // sucess notification for cancel task execution
  useEffect(() => {
    if (canceledTaskExecution && !isEqual(prevCanceledTaskExecution, canceledTaskExecution)) {
      notification.success({
        key: `cancel_task_execution_success_key_${lastExecution?.id}`,
        message: 'Task Execution Canceled',
        placement: 'topRight',
        duration: 3,
      })
    }
  }, [prevCanceledTaskExecution, canceledTaskExecution, lastExecution, notification])

  useEffect(() => {
    // Once you hit "Run Now" button
    // it takes the graph subscription a couple of seconds to update the task execution to "running"
    // we want to disable the button while waiting for this update
    // once it has updated, toggle hasClickedRunNow off (used for "canCancelRunNow")
    if (!isEqual(lastExecution, prevExecution) && hasClickedRunNow) {
      setHasClickedRunNow(false)
    }
  }, [lastExecution, prevExecution, hasClickedRunNow])

  useEffect(() => {
    if (deleteTaskError) {
      handleMavisErrorNotification({ error: deleteTaskError, notification })
    }
  }, [deleteTaskError, notification])

  const handleRunNow = () => {
    analytics.track('triggered_manual_task', {
      task_slug: task.task_slug,
      task_category: task.category,
      task_id: task.id,
    })

    createExecution({ body: { task_id: task.id } })

    setHasClickedRunNow(true)
  }

  const {
    status: lastExecutionStatus,
    started_at: lastExecutionStartedAt,
    completed_at: lastExecutionCompletedAt,
  } = lastExecution

  // if task is currently running
  // show the previous executions completed_at time ago
  const previousCompletedAt = task?.executions[1]?.completed_at

  // when you hit "Run Now" and creating new task execution
  const creatingTaskExecution = createExecutionLoading || hasClickedRunNow

  const honeycombLinks = makeTaskExecutionHoneycombLinks(task?.executions[0])

  // Color of status tag
  const statusColor = getStatusColor(lastExecutionStatus)

  // Pretty name - remove beginning N and M from narratives/materializations tasks
  const prettyName = taskPrettyName(task)

  const cronInvalid = !!cronValidator({ value: updateCron })

  const alertSqlQuery = get(task, 'company_query_alerts[0].sql_query', null)

  return (
    <Box mb={2}>
      <Card>
        <Flex>
          <Box width={2 / 3}>
            <Flex alignItems="center">
              <Box style={{ flex: '0 1 320px', width: '320px' }}>
                <Flex alignItems="baseline">
                  <Typography type="title300" mr={1}>
                    {prettyName}
                  </Typography>
                  {task.internal_only && (
                    <Tooltip title="This task is only visible to internal users.">
                      <div>
                        <LockOutlined style={{ color: colors.red500 }} />
                      </div>
                    </Tooltip>
                  )}

                  {/* show task description icon tooltip if on processing */}
                  {task.category === TASK_CATEGORY_PROCESSING && task.description && (
                    <Tooltip title={task.description}>
                      <div>
                        <InfoCircleOutlined />
                      </div>
                    </Tooltip>
                  )}

                  {/* show link to dataset if in materializations (aka integrations) */}
                  {task.category === TASK_CATEGORY_MATERIALIZATIONS && (
                    <Tooltip title="Go to Dataset">
                      <div>
                        <Link
                          to={`/datasets/edit/${task.dataset_materializations[0]?.dataset?.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          mr={1}
                        >
                          <LinkOutlined />
                        </Link>
                      </div>
                    </Tooltip>
                  )}

                  {/* show assembled narrative link if on narratives and narrative has been assembled */}
                  {task.category === TASK_CATEGORY_NARRATIVES && !isEmpty(task.narratives[0]?.narrative_runs) && (
                    <Tooltip title="Go to Analysis">
                      <div>
                        <Link
                          to={`/narratives/a/${task.narratives[0]?.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <LinkOutlined />
                        </Link>
                      </div>
                    </Tooltip>
                  )}

                  {/* link for transformation that created the alert */}
                  {task.category === TASK_CATEGORY_ALERTS &&
                    !isEmpty(alertSqlQuery?.related_id) &&
                    alertSqlQuery?.related_to === 'transformation' && (
                      <Tooltip title="Go to Transformation">
                        <div>
                          <Link
                            to={`/transformations/edit/${alertSqlQuery.related_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <LinkOutlined />
                          </Link>
                        </div>
                      </Tooltip>
                    )}
                </Flex>

                <CronTranslation crontab={task.schedule} task_created_at={task.created_at} includeTimezone />
              </Box>

              {!isEmpty(lastExecution) && (
                <Box ml={4} style={{ flex: '0 1 100px', width: '100px' }}>
                  <Flex>
                    <Popover
                      content={
                        <div style={{ maxWidth: '540px' }}>
                          <TaskOrExecutionTable
                            id={task.id}
                            task={task}
                            startedAt={lastExecutionStartedAt}
                            completedAt={lastExecutionCompletedAt}
                            status={lastExecutionStatus}
                            honeycombLinks={honeycombLinks as IHoneyCombLink[]}
                            isSubscribed={isSubscribed}
                            refetchWatchers={refetchWatchers}
                            type="task"
                            plotTime={plotTime}
                          />
                        </div>
                      }
                    >
                      <div>
                        <Flex>
                          <Badge
                            status={statusColor as BadgeProps['status']}
                            text={<Typography as="strong">{lastExecutionStatus}</Typography>}
                          />
                        </Flex>
                        <Typography as="div" color="gray500">
                          {timeFromNow(
                            lastExecutionStatus === 'running' ? previousCompletedAt : lastExecutionCompletedAt
                          )}
                        </Typography>
                      </div>
                    </Popover>
                  </Flex>
                </Box>
              )}

              {isSuperAdmin && !isEmpty(honeycombLinks) && (
                <Box ml={4}>
                  <Typography type="title500">Honeycomb Links</Typography>
                  {map(honeycombLinks, (link) => (
                    <Box key={link?.link} mr={1}>
                      <a href={link?.link} target="_blank" rel="noopener noreferrer">
                        {link?.name}
                      </a>
                    </Box>
                  ))}
                </Box>
              )}
            </Flex>
          </Box>
          <Flex justifyContent="flex-end" width={1 / 3}>
            <Flex justifyContent="flex-start" alignItems="center">
              <Box style={{ textAlign: 'right' }}>
                <Typography color="gray500" mr={1}>
                  Next run {nextTimeFromCron(task.schedule, timezone, task.created_at)}
                </Typography>
              </Box>
              <Box width="160px">
                <Flex alignItems="center" justifyContent="space-evenly">
                  <Box>
                    {lastExecutionStatus === 'running' ? (
                      <Popconfirm
                        placement="topLeft"
                        title="Are you sure you want to cancel this run?"
                        onConfirm={handleCancelTask}
                        okText="Yes"
                        cancelText="No"
                      >
                        <ProtectedRoleButton type="primary" danger loading={cancelTaskExecutionLoading}>
                          Cancel Run
                        </ProtectedRoleButton>
                      </Popconfirm>
                    ) : (
                      <Tooltip title={processingIsPaused ? 'Unpause processing to run tasks' : undefined}>
                        <div>
                          <ProtectedRoleButton
                            type="primary"
                            onClick={handleRunNow}
                            loading={creatingTaskExecution}
                            disabled={creatingTaskExecution || processingIsPaused}
                          >
                            Run Now
                          </ProtectedRoleButton>
                        </div>
                      </Tooltip>
                    )}
                  </Box>

                  {isCompanyAdmin && (
                    <Flex alignItems="center">
                      <Tooltip
                        title={isSubscribed ? 'Unsubscribe to Task Failure Emails' : 'Subscribe to Task Failure Emails'}
                      >
                        <IconContainer onClick={toggleTaskSubscription} mx={1}>
                          <Flex flexDirection="column" justifyContent="center">
                            {isSubscribed ? <FiBell /> : <FiBellOff />}
                          </Flex>
                        </IconContainer>
                      </Tooltip>

                      <Tooltip title="Update Schedule">
                        <IconContainer onClick={toggleShowUpdateCronModal} mr={1}>
                          <HistoryOutlined />
                        </IconContainer>
                      </Tooltip>

                      {task?.category !== 'processing' && (
                        <Tooltip title="Delete">
                          <IconContainer onClick={toggleShowDeleteModal}>
                            <DeleteOutlined />
                          </IconContainer>
                        </Tooltip>
                      )}
                    </Flex>
                  )}
                </Flex>
              </Box>
            </Flex>
          </Flex>
        </Flex>
        {(task.category === TASK_CATEGORY_PROCESSING || task.category === TASK_CATEGORY_MATERIALIZATIONS) &&
          lastExecution?.status === 'failed' && (
            <Box mt={1}>
              <JobExecutionErrors taskExecutionId={lastExecution.id} />
            </Box>
          )}

        <RunTransformationsWarning taskSlug={task.task_slug} schedule={task.schedule} />

        {lastExecutionStatus === 'running' && lastExecution?.details?.ran_at && (
          <RunningExecutionDetails
            ranAt={lastExecution?.details?.ran_at}
            runningQuery={lastExecution?.details?.running_query}
          />
        )}
      </Card>

      {/* delete task modal */}
      <Modal
        title="Warning: this is a permanent change!"
        open={showDeleteModal}
        onOk={handleDeleteTask}
        okButtonProps={{ danger: true }}
        onCancel={toggleShowDeleteModal}
      >
        <Spin spinning={deleteTaskLoading}>
          <Box>
            <Typography type="title400" mb={1}>
              Are you sure you want to delete <b>{prettyName}</b>?
            </Typography>
            <Box ml={4}>
              <ul>
                <li>
                  <Typography type="title500" mb={1}>
                    This task will no longer be executed if deleted.
                  </Typography>
                </li>
                {task?.category === 'materializations' && startsWith(task?.task_slug, 'm_mv') && (
                  <li>
                    <Typography type="title500">
                      Deleting this materialization will also delete the materialized view from your warehouse.
                    </Typography>
                  </li>
                )}
              </ul>
            </Box>
          </Box>
        </Spin>
      </Modal>

      {/* update cron modal */}
      <Modal
        title={`Update ${prettyName}'s cron schedule`}
        open={showUpdateCronModal}
        onOk={handleUpdateCron}
        okButtonProps={{
          disabled: cronInvalid,
        }}
        onCancel={onCancelCronModal}
      >
        <Spin spinning={updateScheduleLoading}>
          <Box style={{ width: '400px' }}>
            <CronSelectFormItem
              selectProps={{
                value: updateCron,
                onSelect: setUpdateCron,
                getPopupContainer: true,
              }}
              required
              hasFeedback
              label=""
            />
          </Box>
        </Spin>
      </Modal>
    </Box>
  )
}

export default TaskCard
