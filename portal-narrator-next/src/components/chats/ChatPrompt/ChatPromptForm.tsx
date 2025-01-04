import { zodResolver } from '@hookform/resolvers/zod'
import clsx from 'clsx'
import { useEffect, useLayoutEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import TextareaAutosize from 'react-textarea-autosize'
import SendIcon from 'static/mavis/icons/send.svg'
import { object, string, TypeOf } from 'zod'

import { useKeyboardShortcut } from '@/hooks'

const schema = object({
  prompt: string().min(3).max(5_000),
}).required()

const resolver = zodResolver(schema)

export type ChatPromptFormData = TypeOf<typeof schema>

interface Props {
  defaultValues?: ChatPromptFormData
  onSubmit: (data: ChatPromptFormData) => Promise<void>
  values?: ChatPromptFormData
}

const ChatPromptForm = ({ defaultValues, onSubmit, values }: Props) => {
  const methods = useForm({ defaultValues, resolver, values })
  const { control, formState, handleSubmit, register, setFocus, setValue } = methods
  const { isSubmitting } = formState

  useKeyboardShortcut('/', () => setFocus('prompt'))

  useEffect(() => {
    // This is a hack to reset the prompt field based-off the defaultValues prop since react-hook-form
    // does not merge defaultValues with the values prop as expected.
    setValue('prompt', defaultValues?.prompt || '')
  }, [defaultValues?.prompt, setValue])

  useLayoutEffect(() => {
    if (!isSubmitting) setFocus('prompt')
  }, [setFocus, isSubmitting, values, defaultValues?.prompt])

  const submitForm = handleSubmit(async (formValues: ChatPromptFormData) => {
    methods.resetField('prompt', { defaultValue: '' })
    await onSubmit(formValues)
  })

  return (
    <form className="relative flex items-stretch" onSubmit={submitForm}>
      <Controller
        control={control}
        name="prompt"
        render={({ field, fieldState }) => (
          <TextareaAutosize
            {...register('prompt')}
            autoFocus
            className={clsx('w-full resize-none rounded-xl border-gray-100 p-4 pr-14 text-sm', {
              '!border-red-600 !ring-red-600': fieldState.invalid,
            })}
            maxRows={10}
            minRows={1}
            onKeyDown={(event) => {
              // textarea does not work with keyboard shortcuts hooks
              if (event.key === 'Enter' && !event.shiftKey) {
                submitForm()
                event.stopPropagation()
                event.preventDefault()
              }
            }}
            placeholder="Enter a prompt"
            {...field}
          />
        )}
      />
      <button className="absolute right-3 top-4" disabled={isSubmitting} type="submit">
        <SendIcon className="size-6 rotate-90 stroke-gray-200" />
      </button>
    </form>
  )
}

export default ChatPromptForm
