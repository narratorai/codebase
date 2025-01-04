import { DeleteOutlined } from '@ant-design/icons'
import { ApolloError } from '@apollo/client'
import { App, Button, Popover, Tooltip } from 'antd-next'
import { useUser } from 'components/context/user/hooks'
import { useDeleteCompanySqlQueryMutation } from 'graph/generated'
import { isNil } from 'lodash'
import { useToggle } from 'react-use'

import ConfirmDeleteAlert from './ConfirmDeleteAlert'

interface Props {
  selectedQuery?: { id?: any; name?: string | null | undefined }
  onDelete: () => void
}

const DeleteQueryButton = ({ selectedQuery, onDelete }: Props) => {
  const { notification } = App.useApp()
  const { isCompanyAdmin } = useUser()
  const isEnabled = isCompanyAdmin && selectedQuery
  const [showConfirmationDialog, toggleConfirmationDialog] = useToggle(false)

  const handleSuccess = async () => {
    toggleConfirmationDialog()

    notification.success({
      key: 'delete_query_success',
      message: 'You have successfully deleted this query',
      placement: 'topRight',
    })

    await onDelete()
  }

  const showErrorMessage = (error: ApolloError) => {
    notification.error({
      key: 'delete_query_failure',
      message: 'There was an error deleting this query',
      placement: 'topRight',
      description: error.message,
      duration: 0,
    })
  }

  const [deleteQuery, { loading }] = useDeleteCompanySqlQueryMutation({
    variables: {
      query_id: selectedQuery?.id,
    },
    onCompleted: handleSuccess,
    onError: showErrorMessage,
  })

  return (
    <Popover
      open={showConfirmationDialog}
      onOpenChange={toggleConfirmationDialog}
      placement="right"
      trigger="click"
      title="Delete Query"
      content={
        <ConfirmDeleteAlert
          queryName={selectedQuery?.name || ''} // TODO: Do not display the alert if there is no query selected
          onConfirm={deleteQuery}
          onCancel={toggleConfirmationDialog}
          isDeleting={loading}
        />
      }
    >
      <Tooltip title={isNil(selectedQuery) ? 'This query has not been saved' : null}>
        <Button icon={<DeleteOutlined />} disabled={!isEnabled} danger />
      </Tooltip>
    </Popover>
  )
}

export default DeleteQueryButton
