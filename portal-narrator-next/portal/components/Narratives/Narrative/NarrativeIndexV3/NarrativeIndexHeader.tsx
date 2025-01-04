import { Button, Dropdown } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { Flex, Typography } from 'components/shared/jawns'
import { useContext } from 'react'
import { useHistory } from 'react-router'

import { NARRATIVE_HEADER_HEIGHT, NARRATIVE_HEADER_Z_INDEX } from './constants'
import NarrativeIndexContext from './NarrativeIndexContext'
import NarrativeSearchBar from './NarrativeSearchBar'

const CreateNewButton = () => {
  const company = useCompany()
  const history = useHistory()
  const { handleOpenSaveTemplateOverlay } = useContext(NarrativeIndexContext)

  const navigateToNewNarrative = () => {
    history.push(`/${company.slug}/narratives/new`)
  }

  const menuItems = [
    {
      key: 'scratch',
      onClick: navigateToNewNarrative,
      label: <span data-test="narrative-from-scratch-option">Create Analysis from Scratch</span>,
    },
    {
      key: 'template',
      onClick: handleOpenSaveTemplateOverlay,
      label: <span data-test="narrative-from-template-option">Create Analysis from Template</span>,
    },
  ]

  return (
    <Dropdown menu={{ items: menuItems }}>
      <Button type="primary" data-test="create-narrative-cta">
        Create New
      </Button>
    </Dropdown>
  )
}

const NarrativeIndexHeader = () => {
  return (
    <Flex
      alignItems="center"
      justifyContent="space-between"
      style={{
        position: 'sticky',
        top: 0,
        height: NARRATIVE_HEADER_HEIGHT,
        zIndex: NARRATIVE_HEADER_Z_INDEX,
      }}
    >
      <Flex alignItems="center">
        <Typography type="title300" mr={4}>
          Analyses
        </Typography>

        <NarrativeSearchBar />
      </Flex>

      <CreateNewButton />
    </Flex>
  )
}

export default NarrativeIndexHeader
