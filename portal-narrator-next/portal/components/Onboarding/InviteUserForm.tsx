import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Col, Form, Input, Row, Select } from 'antd-next'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { object, string, z } from 'zod'

const schema = object({
  email: string().min(2).max(150).trim(),
  name: string().min(2).max(50),
  role: z.enum(['admin', 'user']),
}).required()

export type IFormData = z.infer<typeof schema>

interface Props {
  onSubmit: (data: IFormData) => Promise<void>
}

export default function InviteUserForm({ onSubmit: submitForm }: Props) {
  const defaultValues: IFormData = { email: '', name: '', role: 'user' }
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({ defaultValues, resolver: zodResolver(schema) })

  const onSubmit: SubmitHandler<IFormData> = async (data) => {
    await submitForm(data)
    reset(defaultValues, { keepValues: false })
  }

  return (
    <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
      <Row gutter={16} align="bottom">
        <Col span={7}>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Form.Item name="email" label="Email" style={{ marginBottom: 0 }}>
                <Input id="email" status={errors.email ? 'error' : ''} {...field} />
              </Form.Item>
            )}
          />
        </Col>
        <Col span={7}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Form.Item name="name" label="Full Name" style={{ marginBottom: 0 }}>
                <Input id="name" status={errors.name ? 'error' : ''} {...field} />
              </Form.Item>
            )}
          />
        </Col>
        <Col span={6}>
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Form.Item name="role" label="Role" style={{ width: '100%', marginBottom: 0 }}>
                <Select id="role" status={errors.role ? 'error' : ''} {...field}>
                  <Select.Option value="admin">Admin</Select.Option>
                  <Select.Option value="user">Member</Select.Option>
                </Select>
              </Form.Item>
            )}
          />
        </Col>
        <Col span={4}>
          <Button
            type="primary"
            htmlType="submit"
            style={{ width: '100%', background: '#6331B3' }}
            loading={isSubmitting}
          >
            Add
          </Button>
        </Col>
      </Row>
    </Form>
  )
}
