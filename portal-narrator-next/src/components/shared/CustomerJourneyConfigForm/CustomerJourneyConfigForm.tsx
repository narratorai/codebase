import { zodResolver } from '@hookform/resolvers/zod'
import React from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import ActivitiesInput from './ActivitiesInput'
import ActivityActionInput from './ActivityActionInput'
import CustomerInput from './CustomerInput'
import DateRangeInput from './DateRangeInput'
import { ICustomerJourneyConfigFormData, schema } from './interfaces'

const resolver = zodResolver(schema)

interface Props {
  defaultValues?: ICustomerJourneyConfigFormData
  onSubmit: (data: ICustomerJourneyConfigFormData) => Promise<void>
}

const CustomerJourneyConfigForm = ({ defaultValues, onSubmit }: Props) => {
  const methods = useForm({ defaultValues, resolver })
  const { formState, handleSubmit } = methods
  const { isSubmitting } = formState

  const submitForm = handleSubmit(async (formValues: ICustomerJourneyConfigFormData) => {
    await onSubmit(formValues)
  })

  return (
    <FormProvider {...methods}>
      <form onSubmit={submitForm}>
        <div className="h-[116px] items-end justify-between gap-2 p-6 flex-x">
          <CustomerInput />
          <ActivityActionInput />
          <ActivitiesInput />
          <DateRangeInput />
          <button className="button button-xs primary filled" type="submit" disabled={isSubmitting}>
            <span className="button button-xs button-label !px-8">Rerun</span>
          </button>
        </div>
      </form>
    </FormProvider>
  )
}

export default CustomerJourneyConfigForm
