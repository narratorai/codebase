import { useLazyQuery } from '@apollo/client'
import { App, Button } from 'antd-next'
import { useUser } from 'components/context/user/hooks'
import { Flex, Typography } from 'components/shared/jawns'
import { GetCompanyTaskDocument, IWatcher, IWatcher_Relation_Enum, useDeleteWatcherMutation } from 'graph/generated'
import { isEmpty, startCase } from 'lodash'
import { useEffect } from 'react'

interface Props {
  watcher: Partial<IWatcher>
  refetchWatchers?: Function
}

const NotificationItem = ({ watcher, refetchWatchers }: Props) => {
  const { notification } = App.useApp()
  const { user } = useUser()

  const [deleteWatcher, { data: deleteWatcherData, loading: deleteWatcherLoading, error: deleteWatcherError }] =
    useDeleteWatcherMutation({
      variables: {
        user_id: user?.id,
        related_to: watcher.related_to!,
        related_id: watcher.related_id,
      },
    })

  // error notifications on delete
  useEffect(() => {
    if (!isEmpty(deleteWatcherError)) {
      notification.error({
        key: 'delete_error_key',
        message: 'Error: Delete Subscription',
        description: deleteWatcherError?.message,
        placement: 'topRight',
      })
    }
  }, [deleteWatcherError, notification])

  // success notifications on delete
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

  // watcher could be company_task, narrative, dataset... so only look it up based on watcher's "related_to"
  const [getTask, { data: companyTask }] = useLazyQuery(GetCompanyTaskDocument, {
    variables: { id: watcher.related_id },
  })

  useEffect(() => {
    if (watcher.related_to === IWatcher_Relation_Enum.CompanyTask) {
      getTask()
    }
  }, [watcher, getTask])

  if (watcher.related_to === IWatcher_Relation_Enum.CompanyTask && companyTask) {
    return (
      <Flex alignItems="flex-end">
        <Typography mr={3}>{startCase(companyTask.company_task[0]?.task_slug)}</Typography>
        <Button size="small" loading={deleteWatcherLoading} onClick={() => deleteWatcher()}>
          Unsubscribe
        </Button>
      </Flex>
    )
  }

  // TODO: This component currently only supports watcher for company tasks
  // ADD: narrative and dataset support later!
  // For now - just return null
  return null
}

export default NotificationItem
