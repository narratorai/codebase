import { Button, Spin } from 'antd-next'
import { Box, Flex } from 'components/shared/jawns'

interface Props {
  queryName: string
  onCancel: () => void
  onConfirm: () => void
  isDeleting: boolean
}

const ConfirmDeleteAlert = ({ queryName, onCancel, onConfirm, isDeleting }: Props) => {
  return (
    <Box style={{ minWidth: '320px' }}>
      <Spin spinning={isDeleting}>
        Are you sure you want to delete <b>{queryName}</b>?
        <Flex justifyContent="flex-end" mt={3}>
          <Box mr={1}>
            <Button onClick={onCancel}>Cancel</Button>
          </Box>
          <Button onClick={onConfirm} danger>
            Delete
          </Button>
        </Flex>
      </Spin>
    </Box>
  )
}

export default ConfirmDeleteAlert
