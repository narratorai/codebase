import { RightOutlined } from '@ant-design/icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Flex, Form, Input, Select, Typography } from 'antd-next'
import { countries } from 'countries-list'
import { defaultsDeep } from 'lodash'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { object, string, z } from 'zod'

export const schema = object({
  name: string()
    .min(3)
    .max(50)
    .trim()
    .regex(/^[a-zA-Z]{2,}(?: +[a-zA-Z]{2,})+$/, 'Introduce your full name'),
  address: object({
    country: string().length(2).trim(),
    line1: string().min(10).max(50).trim(),
    city: string().min(2).max(50).trim(),
    state: string().max(50).trim().optional(),
  }),
}).required()

type FormData = z.infer<typeof schema>

interface Props {
  values?: z.infer<typeof schema>
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  onManageUsersClick: (data: Record<string, unknown>) => void
}

export default function CompanyAddressForm({ values: initialValues, onSubmit: submitForm, onManageUsersClick }: Props) {
  const defaultValues: FormData = defaultsDeep(initialValues, {
    name: '',
    address: { country: 'US', line1: '', city: '', state: '' },
  })

  const {
    watch,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues, resolver: zodResolver(schema) })

  const onSubmit: SubmitHandler<any> = async (data: Record<string, unknown>) => {
    await submitForm(data)
  }

  const handleManageUsersClick = () => {
    const values = watch()
    onManageUsersClick(values)
  }

  return (
    <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <Form.Item name="name" label="Full name">
            <Input
              id="name"
              placeholder="First and last name"
              size="large"
              status={errors.name ? 'error' : ''}
              {...field}
            />
            <Typography.Text type="danger">{errors.name?.message}</Typography.Text>
          </Form.Item>
        )}
      />
      <Controller
        name="address.country"
        control={control}
        render={({ field }) => (
          <Form.Item name="address.country" label="Country or region">
            <Select id="address.country" size="large" status={errors.address?.country ? 'error' : ''} {...field}>
              {Object.entries(countries).map(([code, country]) => (
                <Select.Option key={code} value={code}>
                  {country.name}
                </Select.Option>
              ))}
            </Select>
            <Typography.Text type="danger">{errors.address?.country?.message}</Typography.Text>
          </Form.Item>
        )}
      />
      <Controller
        name="address.line1"
        control={control}
        render={({ field }) => (
          <Form.Item name="address.line1" label="Address">
            <Input
              id="address.line1"
              placeholder="Street address"
              size="large"
              status={errors.address?.line1 ? 'error' : ''}
              {...field}
            />
            <Typography.Text type="danger">{errors.address?.line1?.message}</Typography.Text>
          </Form.Item>
        )}
      />
      <Flex gap={16}>
        <Controller
          name="address.city"
          control={control}
          render={({ field }) => (
            <Form.Item name="address.city" label="City" style={{ width: '50%' }}>
              <Input
                id="address.city"
                placeholder="City"
                size="large"
                status={errors.address?.city ? 'error' : ''}
                {...field}
              />
              <Typography.Text type="danger">{errors.address?.city?.message}</Typography.Text>
            </Form.Item>
          )}
        />
        <Controller
          name="address.state"
          control={control}
          render={({ field }) => (
            <Form.Item name="address.state" label="State" style={{ width: '50%' }}>
              <Input
                id="address.state"
                placeholder="State"
                size="large"
                status={errors.address?.state ? 'error' : ''}
                {...field}
              />
              <Typography.Text type="danger">{errors.address?.state?.message}</Typography.Text>
            </Form.Item>
          )}
        />
      </Flex>
      <div
        style={{
          margin: '16px -24px',
          borderTop: '1px solid rgb(240, 240, 240)',
          borderBottom: '1px solid rgb(240, 240, 240)',
        }}
      >
        <button type="button" onClick={handleManageUsersClick} style={{ padding: '16px 24px', width: '100%' }}>
          <Flex justify="space-between">
            <span>Manage users</span>
            <RightOutlined />
          </Flex>
        </button>
      </div>
      <Flex gap={16} justify="space-between" style={{ marginTop: 24 }}>
        <div style={{ width: '50%' }} />
        <Button
          htmlType="submit"
          type="primary"
          style={{ width: '50%', background: '#6331B3', color: 'white' }}
          size="large"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          Continue
        </Button>
      </Flex>
    </Form>
  )
}
