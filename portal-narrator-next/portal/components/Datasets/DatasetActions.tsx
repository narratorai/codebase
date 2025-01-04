import { BlockOutlined, DeleteOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons'
import { Dropdown } from 'antd-next'
import { useUser } from 'components/context/user/hooks'
import DatasetIndexContext from 'components/Datasets/DatasetIndexContext'
import { DatasetFromQuery } from 'components/Datasets/interfaces'
import { Box } from 'components/shared/jawns'
import { useContext } from 'react'
import styled from 'styled-components'

const StyledContainer = styled(Box)`
  &:hover {
    cursor: pointer;
  }
`

interface Props {
  dataset: DatasetFromQuery
}

const DatasetActions = ({ dataset }: Props) => {
  const { user, isCompanyAdmin } = useUser()
  const { handleOpenEditDataset, handleOpenDuplicateDataset, handleOpenDeleteDataset } = useContext(DatasetIndexContext)

  // A user should only be able to edit/delete the dataset
  // if they are the creator or an admin
  const canEdit = isCompanyAdmin || user.id === dataset?.created_by

  const openEdit = () => {
    handleOpenEditDataset(dataset)
  }

  const openDuplicate = () => {
    handleOpenDuplicateDataset(dataset)
  }

  const openDelete = () => {
    handleOpenDeleteDataset(dataset)
  }

  const menuItems = [
    {
      key: 'open-edit-dataset-overlay',
      disabled: !canEdit,
      onClick: openEdit,
      icon: <EditOutlined data-test="dataset-actions-edit-option" />,
      label: 'Edit Properties',
    },
    {
      key: 'open-duplicate-dataset-overlay',
      onClick: openDuplicate,
      icon: <BlockOutlined data-test="dataset-actions-duplicate-option" />,
      label: 'Duplicate',
    },
    {
      key: 'open-delete-dataset-overlay',
      disabled: !canEdit,
      onClick: openDelete,
      icon: <DeleteOutlined data-test="dataset-actions-delete-option" />,
      label: 'Delete',
    },
  ]

  return (
    <StyledContainer ml={1} data-test="dataset-actions-dropdown">
      <Dropdown
        menu={{
          items: menuItems,
        }}
      >
        <MoreOutlined />
      </Dropdown>
    </StyledContainer>
  )
}

export default DatasetActions
