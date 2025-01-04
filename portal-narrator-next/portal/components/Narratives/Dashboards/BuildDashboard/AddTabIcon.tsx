import { PlusOutlined } from '@ant-design/icons'
import { Button, Input, Popover } from 'antd-next'
import { Divider } from 'components/antd/staged'
import { Box, Flex } from 'components/shared/jawns'
import { ChangeEvent, useState } from 'react'
import { useFieldArray } from 'react-final-form-arrays'
import { makeShortid } from 'util/shortid'
import useToggle from 'util/useToggle'

interface Props {
  handleOnTabSelect: (key: string) => void
}

const AddTabIcon = ({ handleOnTabSelect }: Props) => {
  const [sectionTitle, setSectionTitle] = useState<string>()
  const [open, toggleOpen] = useToggle(false)

  const { fields: sectionFields } = useFieldArray('narrative.sections', {
    subscription: {
      length: true,
    },
  })

  const handleTitleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSectionTitle(e.target.value)
  }

  const handleClose = () => {
    setSectionTitle('')
    toggleOpen()
  }

  const handleAddTab = () => {
    const newSectionId = makeShortid()

    sectionFields.push({ title: sectionTitle, content: [], takeaway: null, conditioned_on: null, id: newSectionId })

    handleOnTabSelect(newSectionId)
    handleClose()
  }

  return (
    <Popover
      title="Add a New Tab"
      trigger="click"
      open={open}
      onOpenChange={toggleOpen}
      content={
        <Box style={{ minWidth: '400px' }}>
          <Box py={3}>
            <Input onChange={handleTitleOnChange} value={sectionTitle} placeholder="Enter Tab Name" />
          </Box>

          <Divider fullPopoverWidth />
          <Flex justifyContent="flex-end">
            <Box mr={1}>
              <Button onClick={handleClose}>Cancel</Button>
            </Box>
            <Button type="primary" disabled={!sectionTitle?.length} onClick={handleAddTab}>
              Add Tab
            </Button>
          </Flex>
        </Box>
      }
    >
      <Flex alignItems="center" justifyContent="center" style={{ width: '100%', height: '100%' }}>
        <PlusOutlined />
      </Flex>
    </Popover>
  )
}

export default AddTabIcon
