import { SendOutlined } from '@ant-design/icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Flex, Form, Input } from 'antd-next'
import { useEffect, useLayoutEffect } from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { object, string, TypeOf } from 'zod'

import ActivityStreamSelect from './ActivityStream/ActivityStreamSelect'

const schema = object({
  activityStreamId: string().uuid({ message: 'Invalid table ID' }),
  prompt: string().min(2).max(5_000),
}).required()

const resolver = zodResolver(schema)

export type PromptFormData = TypeOf<typeof schema>

interface Props {
  values?: Partial<PromptFormData>
  defaultValues?: Partial<PromptFormData>
  onSubmit: (data: Record<'prompt' | 'activityStreamId', string>) => Promise<void>
  hideActivityStreamInput?: boolean
}

const PromptForm = ({ values, defaultValues, onSubmit, hideActivityStreamInput = false }: Props) => {
  const methods = useForm({ defaultValues, values, resolver })
  const { control, handleSubmit, formState, register, setFocus, setValue } = methods
  const { isSubmitting } = formState

  useEffect(() => {
    // This is a hack to reset the prompt field based-off the defaultValues prop since react-hook-form
    // does not merge defaultValues with the values prop as expected.
    setValue('prompt', defaultValues?.prompt)
  }, [defaultValues?.prompt, setValue])

  useLayoutEffect(() => {
    if (!isSubmitting) setFocus('prompt')
  }, [setFocus, isSubmitting, values, defaultValues?.prompt])

  const submitForm = handleSubmit(async (formValues: Record<string, string>) => {
    methods.resetField('prompt')
    await onSubmit(formValues)
  })

  return (
    <FormProvider {...methods}>
      <Form layout="horizontal" onFinish={submitForm} disabled={isSubmitting}>
        <Flex gap={16}>
          {!hideActivityStreamInput && (
            <Controller
              name="activityStreamId"
              control={control}
              render={({ field, fieldState }) => (
                <ActivityStreamSelect
                  value={field.value}
                  onChange={(e) => field.onChange(e)}
                  status={fieldState.invalid ? 'error' : ''}
                />
              )}
            />
          )}

          <Input.Group style={{ display: 'flex' }} compact>
            <Controller
              name="prompt"
              control={control}
              render={({ field, fieldState }) => (
                <Input.TextArea
                  {...register('prompt')}
                  placeholder="Enter a prompt"
                  status={fieldState.invalid ? 'error' : ''}
                  style={{ flex: 1 }}
                  autoSize={{ minRows: 1, maxRows: 25 }}
                  onKeyDown={(event) => {
                    // Antd's textarea does not work with keyboard shortcuts hooks
                    if (event.key === 'Enter' && !event.shiftKey) {
                      submitForm()
                      event.stopPropagation()
                      event.preventDefault()
                    }
                  }}
                  {...field}
                />
              )}
            />
            <Button type="primary" htmlType="submit" loading={isSubmitting}>
              {/* eslint-disable-next-line react/jsx-max-depth */}
              <SendOutlined />
            </Button>
          </Input.Group>
        </Flex>
      </Form>
    </FormProvider>
  )
}

export default PromptForm
