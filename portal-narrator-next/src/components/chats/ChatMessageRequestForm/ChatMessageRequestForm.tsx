import { zodResolver } from '@hookform/resolvers/zod'
import { useLayoutEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import ContextInput from './ContextInput'
import { IChatMessageRequestFormData, schema } from './interfaces'
import RequestFormFooter from './RequestFormFooter'
import RequestTypeInput from './RequestTypeInput'

const resolver = zodResolver(schema)

interface Props {
  defaultValues?: IChatMessageRequestFormData
  onCancel?: () => void
  onSubmit: (data: IChatMessageRequestFormData) => Promise<void>
}

const ChatMessageRequestForm = ({ defaultValues, onCancel, onSubmit }: Props) => {
  const methods = useForm({ defaultValues, resolver })
  const { formState, handleSubmit, setFocus } = methods
  const { isSubmitting } = formState

  useLayoutEffect(() => {
    if (!isSubmitting) setFocus('context')
  }, [setFocus, isSubmitting, defaultValues?.context])

  const submitForm = handleSubmit(async (formValues: IChatMessageRequestFormData) => {
    await onSubmit(formValues)
    methods.resetField('context', { defaultValue: '' })
  })

  return (
    <FormProvider {...methods}>
      <form onSubmit={submitForm}>
        <div className="space-y-4 p-5">
          <RequestTypeInput />
          <ContextInput />
        </div>
        <RequestFormFooter onCancel={onCancel} />
      </form>
    </FormProvider>
  )
}

export default ChatMessageRequestForm
