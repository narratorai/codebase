import { App, Button, Input, Modal, Popconfirm, Spin } from 'antd-next'
import CompanyTimezoneDatePicker from 'components/antd/CompanyTimezoneDatePicker'
import { FormItem } from 'components/antd/staged'
import { Box, Flex } from 'components/shared/jawns'
import {
  INarrative_Company_Timelines,
  useCreateNarrativeActionMutation,
  useDeleteNarrativeActionMutation,
  useUpdateNarrativeActionMutation,
} from 'graph/generated'
import { isEmpty, pick } from 'lodash'
import { useEffect } from 'react'
import { Field, Form } from 'react-final-form'
import { required } from 'util/forms'

const { TextArea } = Input

interface Props {
  visible: boolean
  setVisible: React.Dispatch<React.SetStateAction<boolean>>
  narrativeId: string
  action?: INarrative_Company_Timelines
}

interface SubmitProps {
  name: string
  description?: string | null
  happened_at: string
}

const NarrativeActionModal = ({ visible, setVisible, narrativeId, action }: Props) => {
  const { notification } = App.useApp()
  const isEdit = !isEmpty(action)

  const toggleVisible = () => {
    setVisible((prevVisible) => !prevVisible)
  }

  const handleSuccess = () => {
    toggleVisible()
  }

  const [updateAction, { error: updateActionError, loading: updateActionLoading }] = useUpdateNarrativeActionMutation({
    onCompleted: handleSuccess,
  })

  const [deleteAction, { error: deleteActionError, loading: deleteActionLoading }] = useDeleteNarrativeActionMutation({
    onCompleted: handleSuccess,
    variables: { id: action?.id },
  })

  const [createAction, { error: createActionError, loading: createActionLoading }] = useCreateNarrativeActionMutation({
    onCompleted: handleSuccess,
  })

  const onSubmit = (formValue: SubmitProps) => {
    if (isEdit) {
      updateAction({
        variables: {
          id: action?.id,
          name: formValue.name,
          description: formValue.description,
          happened_at: formValue.happened_at,
        },
      })
    } else {
      createAction({
        variables: {
          name: formValue.name,
          description: formValue.description,
          happened_at: formValue.happened_at,
          narrative_id: narrativeId,
          related_to: 'narrative',
        },
      })
    }
  }

  const handleDelete = () => {
    deleteAction()
  }

  useEffect(() => {
    if (createActionError) {
      notification.error({
        key: 'create-narrative-action-error',
        message: 'Error: Creating Action',
        description: createActionError?.message,
        placement: 'topRight',
      })
    }
  }, [createActionError, notification])

  useEffect(() => {
    if (deleteActionError) {
      notification.error({
        key: 'delete-narrative-action-error',
        message: 'Error: Deleting Action',
        description: deleteActionError?.message,
        placement: 'topRight',
      })
    }
  }, [deleteActionError, notification])

  useEffect(() => {
    if (updateActionError) {
      notification.error({
        key: 'update-narrative-action-error',
        message: 'Error: Updating Action',
        description: updateActionError?.message,
        placement: 'topRight',
      })
    }
  }, [updateActionError, notification])

  const initialValues = (isEdit ? pick(action, ['name', 'description', 'happened_at']) : {}) as SubmitProps

  return (
    <Form
      onSubmit={onSubmit}
      initialValues={initialValues}
      render={({ handleSubmit, invalid }) => (
        <Modal
          destroyOnClose
          onCancel={() => setVisible(false)}
          open={visible}
          footer={
            <Flex justifyContent={action ? 'space-between' : 'flex-end'}>
              {!!action && (
                <Popconfirm
                  title="Are you sure you want to delete this action?"
                  onConfirm={handleDelete}
                  onCancel={() => toggleVisible()}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button danger>Delete</Button>
                </Popconfirm>
              )}

              <Flex justifyContent="flex-end">
                <Box mr={1}>
                  <Button onClick={() => toggleVisible()}>Cancel</Button>
                </Box>
                <Button type="primary" onClick={handleSubmit} disabled={invalid}>
                  Submit
                </Button>
              </Flex>
            </Flex>
          }
        >
          <Spin spinning={deleteActionLoading || createActionLoading || updateActionLoading}>
            <Box style={{ width: '480px' }} px={2}>
              <Field
                name="name"
                validate={required}
                render={({ input: { onChange, value }, meta }) => (
                  <FormItem label="Name" layout="vertical" meta={meta} required hasFeedback>
                    <Input onChange={onChange} value={value || undefined} />
                  </FormItem>
                )}
              />
              <Field
                name="description"
                render={({ input: { onChange, value }, meta }) => (
                  <FormItem label="Description" layout="vertical" meta={meta}>
                    <TextArea placeholder="Description" onChange={onChange} value={value || undefined} />
                  </FormItem>
                )}
              />

              <Field
                name="happened_at"
                validate={required}
                render={({ input: { onChange, value }, meta }) => (
                  <FormItem label="Happened At" layout="vertical" meta={meta} required>
                    <CompanyTimezoneDatePicker resolution="date" onChange={onChange} value={value} />
                  </FormItem>
                )}
              />
            </Box>
          </Spin>
        </Modal>
      )}
    />
  )
}

export default NarrativeActionModal
