import { App, Button } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { Typography } from 'components/shared/jawns'
import { useNarrativeConfigUpdatedSubscription } from 'graph/generated'
import { isEqual } from 'lodash'
import React, { useEffect } from 'react'
import { userDisplayName } from 'util/helpers'
import usePrevious from 'util/usePrevious'

const NOTIFICATION_KEY = 'last_config_updated_at_key'

interface Props {
  narrativeSlug: string
}

const ConfigUpdatedNotification = ({ narrativeSlug }: Props) => {
  const { user } = useUser()
  const company = useCompany()
  const { notification } = App.useApp()

  // Notify user if different user updates this narrative config
  const { data: configUpdatedData } = useNarrativeConfigUpdatedSubscription({
    variables: {
      narrative_slug: narrativeSlug,
      company_id: company.id,
    },
  })

  const narrativeConfigUpdated = configUpdatedData?.narrative[0]
  const prevNarrativeConfigUpdated = usePrevious(narrativeConfigUpdated)

  // Notify user if the config has been updated by another user
  useEffect(() => {
    if (
      prevNarrativeConfigUpdated?.last_config_updated_at &&
      narrativeConfigUpdated?.last_config_updated_at &&
      !isEqual(prevNarrativeConfigUpdated?.last_config_updated_at, narrativeConfigUpdated?.last_config_updated_at) &&
      !isEqual(narrativeConfigUpdated?.updated_by, user.id)
    ) {
      const updatedCompanyUser = narrativeConfigUpdated.updated_by_user?.company_users?.[0]
      const updatedUserEmail = narrativeConfigUpdated.updated_by_user?.email
      const userName = userDisplayName(updatedCompanyUser?.first_name, updatedCompanyUser?.last_name, updatedUserEmail)

      notification.info({
        key: NOTIFICATION_KEY,
        message: (
          <Typography>
            This narrative has been updated by <span style={{ fontWeight: 'bold' }}>{userName}</span>.
          </Typography>
        ),
        description: (
          <Typography>
            <Button style={{ padding: 0 }} type="link" onClick={() => window.location.reload()}>
              Click here
            </Button>{' '}
            to refresh and see the latest changes
          </Typography>
        ),
        placement: 'topRight',
        duration: null,
      })
    }
  }, [prevNarrativeConfigUpdated, narrativeConfigUpdated, user])

  return null
}

export default ConfigUpdatedNotification
