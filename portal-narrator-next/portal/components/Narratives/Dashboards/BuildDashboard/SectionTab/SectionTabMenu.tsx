import { BlockOutlined, DeleteOutlined, EditOutlined, MenuOutlined } from '@ant-design/icons'
import { Dropdown, Popconfirm } from 'antd-next'
import BuildDashboardContext from 'components/Narratives/Dashboards/BuildDashboard/BuildDashboardContext'
import { SECTION_TAB_QUERY_KEY } from 'components/Narratives/Dashboards/BuildDashboard/constants'
import { Box, Flex } from 'components/shared/jawns'
import { findIndex, isEmpty, map, toNumber } from 'lodash'
import queryString from 'query-string'
import React, { useCallback, useContext } from 'react'
import { useField } from 'react-final-form'
import { useFieldArray } from 'react-final-form-arrays'
import { useHistory } from 'react-router'
import { makeShortid } from 'util/shortid'
import useToggle from 'util/useToggle'

import RenameTabModal from './RenameTabModal'

interface Props {
  sectionId: string
}

const SECTIONS_FIELDNAME = 'narrative.sections'

const SectionTabMenu = ({ sectionId }: Props) => {
  const history = useHistory()
  const { selectedTab } = useContext(BuildDashboardContext)

  const { fields: sectionFields } = useFieldArray(SECTIONS_FIELDNAME, {
    subscription: {
      value: true,
    },
  })

  const sectionIndex = findIndex(sectionFields?.value, ['id', sectionId])
  const sectionValue = sectionFields?.value?.[sectionIndex]

  const {
    input: { value: sectionTitle, onChange: onChangeSectionTitle },
  } = useField(`${SECTIONS_FIELDNAME}[${sectionIndex}].title`, { subscription: { value: true } })

  const [showRenameModal, toggleShowRenameModal] = useToggle(false)

  const handleRenameTab = useCallback(
    (name: string) => {
      if (!isEmpty(name)) {
        onChangeSectionTitle(name)
      }

      // close modal on ok
      toggleShowRenameModal()
    },
    [sectionValue, toggleShowRenameModal, onChangeSectionTitle]
  )

  const handleDuplicateTab = useCallback(() => {
    if (!isEmpty(sectionValue)) {
      const duplicateSectionValue = {
        ...sectionValue,
        // make unique id for the duplicated section
        id: makeShortid(),
        content: map(sectionValue.content, (content) => ({
          ...content,
          // and make sure the content has a different id
          // to ensure the content is not linked to the original section
          // causing both to update on edit (i.e. updating content dimensions)
          id: makeShortid(),
        })),
      }

      sectionFields.insert(sectionIndex + 1, duplicateSectionValue)
    }
  }, [sectionFields?.insert, sectionIndex, sectionValue])

  const handleDeleteTab = useCallback(() => {
    // check if you are deleting the tab you are currently on
    if (toNumber(selectedTab) === sectionIndex) {
      // and redirect to first tab if you are
      const existingSearch = queryString.parse(history.location.search)

      const newSearch = {
        ...existingSearch,
        [SECTION_TAB_QUERY_KEY]: undefined,
      }

      history.push({
        search: `?${queryString.stringify(newSearch)}`,
      })
    }

    // then delete the tab
    sectionFields.remove(sectionIndex)
  }, [history, sectionIndex, sectionFields.remove, selectedTab])

  const menuItems = [
    {
      key: 'rename-tab',
      onClick: toggleShowRenameModal,
      label: (
        <Flex alignItems="center">
          <EditOutlined />
          <Box ml={1}>Rename Tab</Box>
        </Flex>
      ),
    },
    {
      key: 'duplicate-tab',
      onClick: handleDuplicateTab,
      label: (
        <Flex alignItems="center">
          <BlockOutlined />
          <Box ml={1}>Duplicate Tab</Box>
        </Flex>
      ),
    },
    {
      key: 'delete-tab',
      disabled: (sectionFields?.length || 0) <= 1, // don't let them delete last remaining section
      label: (
        <Popconfirm
          trigger="click"
          disabled={(sectionFields?.length || 0) <= 1}
          title="Are you sure you want to delete this tab and its content?"
          onConfirm={handleDeleteTab}
          okText="Delete Tab"
          showArrow={false}
        >
          <Flex alignItems="center">
            <DeleteOutlined />
            <Box ml={1}>Delete Tab</Box>
          </Flex>
        </Popconfirm>
      ),
    },
  ]

  return (
    <Box>
      <Dropdown menu={{ items: menuItems }}>
        <MenuOutlined />
      </Dropdown>

      {showRenameModal && (
        <RenameTabModal initialValue={sectionTitle || ''} onClose={toggleShowRenameModal} onOk={handleRenameTab} />
      )}
    </Box>
  )
}

export default SectionTabMenu
