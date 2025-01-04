import { App, Modal } from 'antd-next'
import { FormItem, SearchSelect } from 'components/antd/staged'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { Box, Typography } from 'components/shared/jawns'
import { useGetCompanyUsersQuery } from 'graph/generated'
import { isEmpty, noop } from 'lodash'
import { useEffect, useState } from 'react'
import { colors } from 'util/constants'
import { useLazyCallMavis } from 'util/useCallMavis'
import usePrevious from 'util/usePrevious'

interface Props {
  onClose: () => void
  onDeleteSuccess: () => void
  open: boolean
  selectedCompanyUser: {
    id: string
    user: {
      email: string
      id: string
    }
  }
}

const DeleteUserAlert = ({ onClose, open, selectedCompanyUser, onDeleteSuccess }: Props) => {
  const { notification } = App.useApp()
  const { user } = useUser()
  const company = useCompany()

  const [userToTransferTo, setUserToTransferTo] = useState<string | undefined>()

  const handleSelectTransferToUser = (userId: string) => {
    setUserToTransferTo(userId)
  }

  const { data: companyUserData, loading: loadingUsers } = useGetCompanyUsersQuery({
    variables: { company_slug: company?.slug },
  })
  const companyUsers = companyUserData?.company_users

  // exclude the user being deleted from the transfer to options
  const transferToOptions = (
    companyUsers?.map((companyUser) => ({
      label: companyUser.user.email,
      value: companyUser.user.id,
    })) || []
  ).filter((op) => op.value !== selectedCompanyUser?.user?.id)

  const handleDeleteUserSuccess = () => {
    notification.success({
      key: 'delete-user-success',
      message: 'User Deleted',
      placement: 'topRight',
    })

    onDeleteSuccess()

    onClose()
  }

  // Delete User (all ids should be USER id, not company user id)
  // will transfer resources from deleted user to selected transfer to user
  const [deleteUser, { loading: deleteLoading, error: errorDeleting, response: deleteResponse }] =
    useLazyCallMavis<any>({
      retryable: true,
      method: 'POST',
      path: '/admin/v1/user/delete',
    })
  const prevDeleteLoading = usePrevious(deleteLoading)

  const handleDelete = () => {
    deleteUser({
      body: {
        user_id: selectedCompanyUser.user.id,
        to_user_id: userToTransferTo,
      },
    })
  }

  // show success notification and close modal on success
  useEffect(() => {
    if (prevDeleteLoading && !deleteLoading && !errorDeleting && !!deleteResponse) {
      handleDeleteUserSuccess()
    }
  }, [prevDeleteLoading, deleteLoading, deleteResponse, errorDeleting, handleDeleteUserSuccess])

  if (!open || isEmpty(selectedCompanyUser?.user?.email)) {
    return null
  }

  const isCurrentUser = user.email === selectedCompanyUser.user.email

  return (
    <Modal
      data-test="delete-user-modal"
      title="Delete User"
      open
      onCancel={() => {
        onClose()
      }}
      okText="Delete User"
      onOk={isCurrentUser ? noop : handleDelete}
      okButtonProps={{
        danger: true,
        loading: deleteLoading,
        disabled: isCurrentUser || deleteLoading || loadingUsers || !userToTransferTo,
      }}
    >
      {!isCurrentUser && (
        <Box>
          <Typography type="body100" mb={2}>
            Are you sure you want to delete <b>{selectedCompanyUser.user.email}</b>?
          </Typography>

          <Typography type="body100">If so, who should we transfer their resources to?</Typography>
          <Typography type="body100" style={{ color: colors.gray400 }} mb={2}>
            (i.e. Narratives, Datasets, Dashboards, etc.)
          </Typography>

          <FormItem>
            <SearchSelect
              data-test="transfer-to-user-select"
              options={transferToOptions}
              onSelect={handleSelectTransferToUser}
              placeholder="User to transfer resources to"
            />
          </FormItem>
        </Box>
      )}

      {isCurrentUser && (
        <Typography type="body100" mb="16px">
          If you'd like to remove yourself from Narrator, please contact{' '}
          <a href="mailto:support@narrator.ai">support@narrator.ai</a> so we can properly transition your admin
          privileges to another user.
        </Typography>
      )}
    </Modal>
  )
}

export default DeleteUserAlert
