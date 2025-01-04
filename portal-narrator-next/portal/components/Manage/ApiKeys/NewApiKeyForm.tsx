import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Form, Input, Typography } from 'antd-next'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { object, string } from 'zod'

import CompanyUserSelect from './CompanyUserSelect'

export interface IFormData {
  label: string
  user: { id: string }
}

interface Props {
  onSubmit: (data: IFormData) => Promise<void>
}

const schema = object({
  label: string().max(50).min(2).trim(),
  user: object({
    id: string().uuid('This field is required'),
  }).required(),
}).required()

export default function NewApiKeyForm({ onSubmit: submitForm }: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { label: '', user: { id: '' } },
    resolver: zodResolver(schema),
  })

  const onSubmit: SubmitHandler<IFormData> = async (data) => {
    await submitForm(data)
  }

  return (
    <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
      <Controller
        name="label"
        control={control}
        render={({ field }) => (
          <Form.Item name="label" label="Label">
            <Input id="label" status={errors.label ? 'error' : ''} {...field} />
            <Typography.Text type="danger">{errors.label?.message}</Typography.Text>
          </Form.Item>
        )}
      />
      <Controller
        name="user.id"
        control={control}
        render={({ field }) => (
          <Form.Item name="user.id" label="User">
            <CompanyUserSelect
              id="user.id"
              status={errors.user?.id ? 'error' : ''}
              style={{ width: '100%' }}
              {...field}
            />
            <Typography.Text type="danger">{errors.user?.id?.message}</Typography.Text>
          </Form.Item>
        )}
      />

      <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting}>
        Submit
      </Button>
    </Form>
  )
}
