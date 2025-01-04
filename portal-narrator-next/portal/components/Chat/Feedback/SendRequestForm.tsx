import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Form, Input, Select, Space, Typography } from 'antd-next'
import { FormItem } from 'components/antd/staged'
import { isEmpty } from 'lodash'
import { MessageTypes } from 'portal/stores/chats'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { object, string } from 'zod'

const schema = object({
  request_type: string(),
  context: string().max(500).trim(),
}).required()

const resolver = zodResolver(schema)

const TYPE_OPTIONS = [
  { value: 'Missing Activity' }, // default if dataset config message
  { value: 'Incorrect Data' },
  { value: 'AI failed to Answer my question' }, // default if not dataset config message
  { value: 'Other' },
]

interface Props {
  values?: {
    request_type: string
    context: string
  }
  onSubmit: (data: Record<string, string>) => Promise<void>
  messageType: MessageTypes
}

const getDefaultValues = (messageType: MessageTypes) => {
  let defaultValues = {
    request_type: TYPE_OPTIONS[2].value,
    context: '',
  }

  if (messageType === MessageTypes.DatasetConfig) {
    defaultValues = {
      request_type: TYPE_OPTIONS[0].value,
      context: '',
    }
  }

  return defaultValues
}

const SendRequestForm = ({ values, onSubmit, messageType }: Props) => {
  const defaultValues = getDefaultValues(messageType)
  const methods = useForm({ defaultValues: isEmpty(values) ? defaultValues : values, values, resolver })
  const { control, handleSubmit, formState } = methods

  return (
    <FormProvider {...methods}>
      <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Controller
            name="request_type"
            control={control}
            render={({ field, fieldState }) => (
              <FormItem label="Request Type" layout="vertical" compact>
                <Select
                  options={TYPE_OPTIONS}
                  placeholder="Type"
                  style={{ width: '100%' }}
                  status={fieldState.invalid ? 'error' : ''}
                  {...field}
                />
              </FormItem>
            )}
          />
          <Controller
            name="context"
            control={control}
            render={({ field, fieldState }) => (
              <FormItem label="Context" layout="vertical" compact>
                <Input.TextArea
                  placeholder="Explain the problem you want the data team to solve. Please include any needed context."
                  status={fieldState.invalid ? 'error' : ''}
                  style={{ flex: 1 }}
                  autoSize={{ minRows: 3, maxRows: 25 }}
                  {...field}
                />
                <Typography.Text type="danger">{fieldState.error?.message}</Typography.Text>
              </FormItem>
            )}
          />
          <Button type="primary" htmlType="submit" loading={formState.isSubmitting}>
            Send to a Human
          </Button>
        </Space>
      </Form>
    </FormProvider>
  )
}

export default SendRequestForm
