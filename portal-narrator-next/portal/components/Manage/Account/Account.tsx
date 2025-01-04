import { useCompany } from 'components/context/company/hooks'
import { SimpleLoader } from 'components/shared/icons/Loader'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { ICompany_User, useGetCompanyUsersQuery } from 'graph/generated'
import { filter } from 'lodash'
import { useState } from 'react'

import CompanyUsersTable from '../User/CompanyUsersTable'
import DeleteUserAlert from '../User/DeleteUserAlert'
import InternalAccessToggle from '../User/InternalAccessToggle'
import ToggleSingleMultiAddUser from '../User/ToggleSingleMultiAddUser'
import TransferUserModal from '../User/TransferUserModal'

interface Props {
  hideAccessToggle?: boolean
}

const Account = ({ hideAccessToggle = false }: Props) => {
  const company = useCompany()
  const queryVariables = { company_slug: company.slug }

  const [deleteId, setDeleteId] = useState<string | undefined>()
  const [transferId, setTransferId] = useState<string | undefined>()

  const { data, loading, refetch } = useGetCompanyUsersQuery({ variables: queryVariables })

  const handleOpenDeleteAlert = (selectedId: string) => {
    setDeleteId(selectedId)
  }

  const handleOpenTransferOverlay = (selectedId: string) => {
    setTransferId(selectedId)
  }

  const handleCloseOverlay = () => {
    setDeleteId(undefined)
    setTransferId(undefined)
  }

  const onDeleteSuccess = () => {
    refetch(queryVariables)
  }

  const companyUsers = data?.company_users as ICompany_User[]

  if (loading || !data) {
    return <SimpleLoader />
  }

  const selectedDeleteCompanyUser = filter(companyUsers, ['id', deleteId])[0] as ICompany_User
  const selectedTransferCompanyUser = filter(companyUsers, ['id', transferId])[0] as ICompany_User

  return (
    // padding bottom makes chat bubble not cover the pagination options
    <Box pb={8}>
      <Flex mb={3} justifyContent="space-between" data-public>
        <ToggleSingleMultiAddUser refetch={refetch} />
      </Flex>

      <Flex alignItems="center" justifyContent="space-between">
        <Typography>
          <a
            href="https://docs.narrator.ai/docs/invite-users#permissions-by-user-role"
            target="_blank"
            rel="noreferrer"
          >
            See here
          </a>
          <span> for more info on permissions by user role.</span>
        </Typography>

        <Typography type="body100" color="gray600">
          Total users: {companyUsers.length}
        </Typography>
      </Flex>

      <CompanyUsersTable onDelete={handleOpenDeleteAlert} onTransfer={handleOpenTransferOverlay} />

      {!hideAccessToggle && (
        <Box mt={2}>
          <InternalAccessToggle />
        </Box>
      )}

      <DeleteUserAlert
        onClose={handleCloseOverlay}
        onDeleteSuccess={onDeleteSuccess}
        open={!!deleteId}
        selectedCompanyUser={selectedDeleteCompanyUser}
      />

      <TransferUserModal
        onClose={handleCloseOverlay}
        open={!!transferId}
        selectedCompanyUser={selectedTransferCompanyUser}
      />
    </Box>
  )
}

export default Account
