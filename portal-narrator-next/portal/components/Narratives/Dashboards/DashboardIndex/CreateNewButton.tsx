import { Button, Dropdown } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { useContext } from 'react'
import { useHistory } from 'react-router'

import DashboardIndexContent from './DashboardIndexContext'

const CreateNewButton = () => {
  const history = useHistory()
  const company = useCompany()
  const { handleOpenSaveTemplateOverlay } = useContext(DashboardIndexContent)

  const handleCreateFromScratch = () => {
    history.push(`/${company.slug}/dashboards/new`)
  }

  const menuItems = [
    {
      key: 'scratch',
      onClick: handleCreateFromScratch,
      label: 'Create Dashboard from Scratch',
    },
    {
      key: 'template',
      onClick: handleOpenSaveTemplateOverlay,
      label: 'Create Dashboard from Template',
    },
  ]

  return (
    <Dropdown menu={{ items: menuItems }}>
      <Button type="primary">Create New</Button>
    </Dropdown>
  )
}

export default CreateNewButton
