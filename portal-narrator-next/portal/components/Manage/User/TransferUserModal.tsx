import { App, Modal } from 'antd-next'
import { FormItem, SearchSelect } from 'components/antd/staged'
import { useCompany } from 'components/context/company/hooks'
import { Box } from 'components/shared/jawns'
import { useGetCompanyUsersQuery } from 'graph/generated'
import { useEffect, useState } from 'react'
import { useLazyCallMavis } from 'util/useCallMavis'
import usePrevious from 'util/usePrevious'

interface Props {
  onClose: () => void
  open: boolean
  selectedCompanyUser: {
    id: string
    user: {
      email: string
      id: string
    }
  }
}

const TransferUserModal = ({ onClose, open, selectedCompanyUser }: Props) => {
  const { notification } = App.useApp()
  const company = useCompany()

  const [userToTransferTo, setUserToTransferTo] = useState<string | undefined>()

  const handleSelectTransferToUser = (userId: string) => {
    setUserToTransferTo(userId)
  }

  const { data: companyUserData, loading: loadingUsers } = useGetCompanyUsersQuery({
    variables: { company_slug: company?.slug },
  })
  const companyUsers = companyUserData?.company_users

  // exclude the user being transfered_from, from the transfer_to options
  const transferToOptions = (
    companyUsers?.map((companyUser) => ({
      label: companyUser.user.email,
      value: companyUser.user.id,
    })) || []
  ).filter((op) => op.value !== selectedCompanyUser?.user?.id)

  // Transfer User Resources to another user
  const [transferUser, { loading: transferLoading, error: transferError, response: transferResponse }] =
    useLazyCallMavis<any>({
      retryable: true,
      method: 'POST',
      path: '/admin/v1/user/transfer',
    })
  const prevTransferLoading = usePrevious(transferLoading)

  const handleTransfer = () => {
    transferUser({
      body: {
        from_user_id: selectedCompanyUser.user.id,
        to_user_id: userToTransferTo,
      },
    })
  }

  const handleTransferSuccess = () => {
    const transferToUser = companyUsers?.find((companyUser) => companyUser.user.id === userToTransferTo)
    notification.success({
      key: 'transfer-user-success',
      message: `Transferred all items to ${transferToUser?.user?.email}`,
      placement: 'topRight',
    })

    onClose()
  }

  // show success notification and close modal on success
  useEffect(() => {
    if (prevTransferLoading && !transferLoading && !transferError && !!transferResponse) {
      handleTransferSuccess()
    }
  }, [prevTransferLoading, transferLoading, transferResponse, transferError, handleTransferSuccess])

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleTransfer}
      okText="Transfer"
      title="Transfer User Resources"
      okButtonProps={{ loading: transferLoading, disabled: !userToTransferTo || transferLoading || loadingUsers }}
    >
      <Box py={2}>
        <FormItem
          label={
            <div>
              Transfer all of <span style={{ fontWeight: 'bold' }}>{selectedCompanyUser?.user?.email}</span>'s resources
              to:
            </div>
          }
          help="Resources include Datasets, Narratives, Dashboards, etc."
          layout="vertical"
        >
          <SearchSelect
            options={transferToOptions}
            onSelect={handleSelectTransferToUser}
            placeholder="User to transfer resources to"
          />
        </FormItem>
      </Box>
    </Modal>
  )
}

export default TransferUserModal
