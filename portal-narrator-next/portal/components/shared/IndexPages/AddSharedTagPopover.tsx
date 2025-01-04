import { PlusOutlined } from '@ant-design/icons'
import { App, Button, Input, Popover, Space } from 'antd-next'
import { Divider, FormItem } from 'components/antd/staged'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { Box, Flex, Typography } from 'components/shared/jawns'
import SimpleColorPicker from 'components/shared/SimpleColorPicker'
import { useCreateCompanyTagMutation } from 'graph/generated'
import React, { useState } from 'react'
import { Form, useField } from 'react-final-form'
import styled from 'styled-components'
import { colors } from 'util/constants'
import { reportError } from 'util/errors'
import { required } from 'util/forms'

const AddCategoryButtonContainer = styled(Box)`
  color: ${colors.gray600};

  &:hover {
    cursor: pointer;
    color: ${colors.blue500};
  }
`

const DEFAULT_VALUES = {
  color: colors.gray300,
}

interface SubmitProps {
  tag: string
  user_id: string
  color: string
}

interface PopverContentProps {
  handleClose: () => void
  handleSubmit: () => void
  valid: boolean
}

const PopoverContent: React.FC<PopverContentProps> = ({ handleClose, handleSubmit, valid }) => {
  const { input: tagInput, meta: tagMeta } = useField('tag', { subscription: { value: true }, validate: required })
  const { input: colorInput, meta: colorMeta } = useField('color', { subscription: { value: true } })

  return (
    <Box>
      <FormItem label="Tag Name" meta={tagMeta} layout="vertical" required hasFeedback>
        <Input placeholder="Enter a Tag Name" {...tagInput} />
      </FormItem>

      <FormItem label="Tag Color" meta={colorMeta} layout="vertical">
        <SimpleColorPicker onChange={(value) => colorInput.onChange(value)} value={colorInput.value} />
      </FormItem>

      <Divider fullPopoverWidth />
      <Flex justifyContent="flex-end">
        <Space>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="primary" onClick={handleSubmit} disabled={!valid}>
            Apply
          </Button>
        </Space>
      </Flex>
    </Box>
  )
}

const AddSharedTagPopover = () => {
  const { notification } = App.useApp()
  const { isCompanyAdmin } = useUser()
  const company = useCompany()

  const [visible, setVisible] = useState(false)

  const [createCompanyTag] = useCreateCompanyTagMutation({
    onError: (error) => {
      reportError('Create Shared Tag Error', error)
      notification.error({ key: 'create-shared-tag-error', message: error.message })
    },
  })

  const handleClose = () => {
    setVisible(false)
  }

  const onSubmit = async (formValue: SubmitProps) => {
    if (isCompanyAdmin && company?.id) {
      await createCompanyTag({
        variables: { tag: formValue.tag, color: formValue.color, company_id: company.id },
        refetchQueries: ['ListCompanyTags'], // refetch tags so sidebar is up-to-date
      })
    }

    setVisible(false)
  }

  return (
    <Form
      initialValues={DEFAULT_VALUES}
      onSubmit={onSubmit}
      render={({ handleSubmit, valid, form: { reset } }) => {
        return (
          <Popover
            title={<Typography>Add a Shared Tag</Typography>}
            trigger="click"
            placement="right"
            open={visible}
            onOpenChange={(visible: boolean) => {
              if (!visible) {
                setVisible(false)
              }

              reset(DEFAULT_VALUES)
            }}
            content={<PopoverContent handleClose={handleClose} handleSubmit={handleSubmit} valid={valid} />}
          >
            <AddCategoryButtonContainer
              onClick={() => {
                setVisible(true)
              }}
            >
              <Button size="small" type="dashed" icon={<PlusOutlined />}>
                Tag
              </Button>
            </AddCategoryButtonContainer>
          </Popover>
        )
      }}
    />
  )
}

export default AddSharedTagPopover
