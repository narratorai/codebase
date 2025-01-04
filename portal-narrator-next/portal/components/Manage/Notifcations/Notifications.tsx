import { Alert, App, Button, Result, Spin, Switch } from 'antd-next'
import { useUser } from 'components/context/user/hooks'
import { Box, Flex, Link, Typography } from 'components/shared/jawns'
import { FixedSider, LayoutContent } from 'components/shared/layout/LayoutWithFixedSider'
import Page from 'components/shared/Page'
import {
  useCreateCompanyUserEmailOptOutMutation,
  useGetCompanyUserPreferencesQuery,
  useListWatchersQuery,
} from 'graph/generated'
import { get, groupBy, keys, map, startCase } from 'lodash'
import { useEffect } from 'react'

import NotificationItem from './NotificationItem'

const Notifications = () => {
  const { notification } = App.useApp()
  const { user } = useUser()

  const {
    data: watcherData,
    loading: watcherLoading,
    error: watcherError,
    refetch: refetchWatchers,
  } = useListWatchersQuery({
    variables: { user_id: user?.id },
  })

  const {
    data: preferenceData,
    loading: preferenceLoading,
    error: preferenceError,
    refetch: refetchPreferences,
  } = useGetCompanyUserPreferencesQuery({
    variables: { company_user_id: user?.company_users[0]?.id },
  })
  const optOutOfEmail = get(preferenceData, 'company_user_preferences[0].email_opt_out', false)

  const [updateEmailOptOut, { error: updateEmailOptOutError }] = useCreateCompanyUserEmailOptOutMutation()

  const handleToggleOptOutEmail = () => {
    updateEmailOptOut({ variables: { email_opt_out: !optOutOfEmail, company_user_id: user?.company_users[0]?.id } })
    refetchPreferences()
  }

  // handle graph errors
  useEffect(() => {
    if (watcherError) {
      notification.error({
        key: 'watcher-error-key',
        message: 'Error: Fetching Notifications',
        description: watcherError?.message,
        placement: 'topRight',
      })
    }
  }, [watcherError, notification])

  useEffect(() => {
    if (preferenceError) {
      notification.error({
        key: 'fetch-email-opt-out-error-key',
        message: 'Error: Fetching Email Opt Out',
        description: preferenceError?.message,
        placement: 'topRight',
      })
    }
  }, [preferenceError, notification])

  useEffect(() => {
    if (updateEmailOptOutError) {
      notification.error({
        key: 'update-email-opt-out-error-key',
        message: 'Error: Updating Email Opt Out',
        description: updateEmailOptOutError?.message,
        placement: 'topRight',
      })
    }
  }, [updateEmailOptOutError, notification])

  const watchersByType = groupBy(watcherData?.watcher, 'related_to')
  const totalSubscriptions = watcherData?.watcher.length

  return (
    <Page title="Notifications | Narrator" breadcrumbs={[{ text: 'Notifications' }]}>
      <FixedSider data-public>
        <Spin spinning={watcherLoading || preferenceLoading}>
          <Box p={3}>
            <Typography mt={1} type="title300">
              Notifications
            </Typography>
            <Typography color="gray700" mt={2}>
              Subscribe to data processing tasks to receive email notifications any time tasks fail.
            </Typography>
            {!watcherLoading && (
              <Typography my={4} type="title400">
                Total Notifications: {totalSubscriptions}
              </Typography>
            )}

            <Box>
              <Flex justifyContent="space-between" mb={1}>
                <Typography mb={1} type="title400">
                  Send me notifications
                </Typography>

                <Switch
                  checked={!optOutOfEmail}
                  checkedChildren="Opted In"
                  unCheckedChildren="Opted Out"
                  onChange={handleToggleOptOutEmail}
                />
              </Flex>
              <Alert
                type="info"
                message="Opting out of notifications here will stop all outreach emails, but will not stop notifications you are subscribed to. To opt out of all emails, you must unsubscribe from those notifications to the right."
              />
            </Box>
          </Box>
        </Spin>
      </FixedSider>

      <LayoutContent data-public>
        <Box p={3}>
          {totalSubscriptions !== undefined && totalSubscriptions < 1 ? (
            <Result
              title="You're currently subscribed to 0 notifications"
              extra={
                <Box>
                  <Typography mb={2}>
                    You can subscribe to data processing tasks to receive email notifications any time tasks fail.
                  </Typography>
                  <Link to="/manage/tasks">
                    <Button type="primary" key="processing">
                      Go To Processing
                    </Button>
                  </Link>
                </Box>
              }
            />
          ) : (
            map(keys(watchersByType), (key) => (
              <Box mb={3} ml={2}>
                <Typography type="title400" fontWeight="bold">{`${startCase(key)}s`}</Typography>
                {map(watchersByType[key], (watcher) => (
                  <Box mt={2} ml={2}>
                    <NotificationItem watcher={watcher} refetchWatchers={refetchWatchers} />
                  </Box>
                ))}
              </Box>
            ))
          )}
        </Box>
      </LayoutContent>
    </Page>
  )
}

export default Notifications
