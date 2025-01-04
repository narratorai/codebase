import { InfoCircleOutlined } from '@ant-design/icons'
import { App, Tooltip } from 'antd-next'
import { useCompany, useCompanyRefetch } from 'components/context/company/hooks'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { useEffect } from 'react'
import { useLazyCallMavis } from 'util/useCallMavis'

import PopconfirmAccessToggle, { AccessToggle } from './PopconfirmAccessToggle'

const Title = () => {
  return (
    <Flex mb={1} alignItems="center">
      <Typography type="title400" mr={1}>
        Allow account access to Narrator Support
      </Typography>

      <Tooltip title="Allow the Narrator Support team to access your account to help in debugging, onboarding, and support.">
        <InfoCircleOutlined />
      </Tooltip>
    </Flex>
  )
}

const InternalAccessToggle = () => {
  const { notification } = App.useApp()
  const company = useCompany()
  const refetchCompanySeed = useCompanyRefetch()

  const companyAllowsNarratorAccess = company.allow_narrator_employee_access

  // Post to mavis to update company's allow_narrator_employee_access
  const [updateAccess, { response: updateAccessResponse, loading: updateAccessLoading }] = useLazyCallMavis<FormData>({
    method: 'POST',
    path: '/admin/v1/user/update_internal_access',
  })

  const toggleAccess = () => {
    updateAccess({
      body: {
        allow_narrator_employee_access: !companyAllowsNarratorAccess,
      },
    })
  }

  // handle success - notification and refetch company
  useEffect(() => {
    if (updateAccessResponse) {
      notification.success({
        key: 'update-access-success',
        placement: 'topRight',
        message: 'Update Access Successful',
      })
    }

    refetchCompanySeed?.()
  }, [updateAccessResponse, refetchCompanySeed, notification])

  return (
    <Box>
      <Title />

      {/* if they're restricting narrator access make sure they really want to */}
      {companyAllowsNarratorAccess ? (
        <PopconfirmAccessToggle
          checked={companyAllowsNarratorAccess}
          loading={updateAccessLoading}
          onChange={toggleAccess}
        />
      ) : (
        <AccessToggle checked={companyAllowsNarratorAccess} loading={updateAccessLoading} onChange={toggleAccess} />
      )}
    </Box>
  )
}

export default InternalAccessToggle
