import { App, Spin } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { ICompany_User, useGetCompanyUsersQuery } from 'graph/generated'
import { isEmpty, keys, map, values } from 'lodash'
import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import usePrevious from 'util/usePrevious'

import EmailsInput from './EmailsInput'
import ProgressBar from './ProgressBar'
import SubmitButton from './SubmitButton'
import useAddMultipleUsers, { EmailErrors } from './useAddMultipleUsers'

interface FormData {
  emails: string[]
}

interface Props {
  refetchCompanyUsers?: () => void
}

const AddMultipleUsers = ({ refetchCompanyUsers }: Props) => {
  const { notification } = App.useApp()
  const company = useCompany()

  const { data: companyUsersData, loading: companyUsersLoading } = useGetCompanyUsersQuery({
    variables: { company_slug: company.slug },
  })
  const companyUsers = companyUsersData?.company_users as ICompany_User[]

  const methods = useForm<FormData>({ mode: 'all' })
  const { handleSubmit, reset } = methods

  const [addMultipleUsers, { currentEmailBeingAdded, emailsInvited, emailsFailed, loading }] = useAddMultipleUsers()
  const prevLoading = usePrevious(loading)

  // refetch company users when done adding multiple users
  useEffect(() => {
    // after attempting to add multiple users
    if (prevLoading && !loading) {
      // refetch users if even one was successully added
      if (!isEmpty(emailsInvited)) {
        refetchCompanyUsers?.()
      }

      // if there were no failed emails, show success notification
      // and reset form (clear emails)
      if (!isEmpty(emailsInvited) && isEmpty(emailsFailed)) {
        notification.success({
          key: 'all-users-created-successfully',
          placement: 'topRight',
          message: 'All Users Created',
        })

        reset()
      }

      // if there were only failed emails, show error notification
      if (isEmpty(emailsInvited) && !isEmpty(emailsFailed)) {
        failedToAddUsersNotification({ emailsFailed, notification })
      }

      // if there was a combination of success and failure, show both success/error notification
      if (!isEmpty(emailsInvited) && !isEmpty(emailsFailed)) {
        failedToAddUsersNotification({ emailsFailed, notification })

        notification.success({
          key: 'some-users-created-successfully',
          placement: 'topRight',
          message: 'Some Users Created',
          description: map(emailsInvited, (email) => (
            <Typography style={{ fontWeight: 'bold' }} mb={1}>
              {email}
            </Typography>
          )),
        })
      }
    }
  }, [prevLoading, loading, emailsInvited, emailsFailed, refetchCompanyUsers, reset])

  const handleSubmitUsers = handleSubmit((formData: FormData) => {
    const emails = formData?.emails

    if (!isEmpty(emails)) return addMultipleUsers(emails)
  })

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmitUsers}>
        <Spin spinning={companyUsersLoading}>
          <EmailsInput companyUsers={companyUsers} />

          <Flex justifyContent="space-between">
            <Box>
              <ProgressBar
                loading={loading}
                emailsFailed={emailsFailed}
                emailsInvited={emailsInvited}
                currentEmailBeingAdded={currentEmailBeingAdded}
              />
            </Box>
            <SubmitButton addUsersLoading={loading} />
          </Flex>
        </Spin>
      </form>
    </FormProvider>
  )
}

const failedToAddUsersNotification = ({
  emailsFailed,
  notification,
}: {
  emailsFailed: EmailErrors
  notification: any
}) => {
  const description = (
    <Box>
      {map(emailsFailed, (failedEmailAndError) => {
        const email = keys(failedEmailAndError)?.[0]
        const error = values(failedEmailAndError)?.[0]

        return (
          <Typography mb={1}>
            <span style={{ fontWeight: 'bold' }}>{email}:</span> {error}
          </Typography>
        )
      })}
    </Box>
  )

  notification.error({
    key: 'all-users-failed-to-create',
    placement: 'topRight',
    duration: null,
    message: 'Error Adding Users',
    description,
  })
}

export default AddMultipleUsers
