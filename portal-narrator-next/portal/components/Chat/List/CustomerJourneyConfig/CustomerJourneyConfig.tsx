import { Button, Flex } from 'antd-next'
import { isEmpty } from 'lodash'
import { IMessage } from 'portal/stores/chats'
import { FormProvider, useForm } from 'react-hook-form'

import CustomerSelect from './CustomerSelect'
import DateRange from './DateRange'
import LimitActivitiesSelect from './LimitActivitiesSelect'

export interface FormValues {
  customer: string
  limit_activities: string[]
  from_time?: string | null
  to_time?: string | null
}

interface Props {
  values: Record<string, unknown>
  onSubmit: (data: FormValues) => Promise<void>
  message: IMessage
  isViewMode: boolean
}

const CustomerJourneyConfig = ({ values, onSubmit, message, isViewMode }: Props) => {
  const methods = useForm<FormValues>({
    defaultValues: values,
  })
  const {
    handleSubmit,
    formState: { isSubmitting },
    watch,
  } = methods

  const handleSubmitFormValues = handleSubmit(async (formValues: FormValues) => {
    await onSubmit(formValues)
  })

  const formValues = watch()
  const { from_time: fromTime, to_time: toTime, limit_activities: limitActivities } = formValues

  const showLimitActivities = !isEmpty(limitActivities) || !isViewMode
  const showTimeRange = fromTime || toTime || !isViewMode

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmitFormValues}>
        <Flex justify="flex-start" align="flex-start" gap={24} wrap="wrap">
          <div style={{ width: '45%' }}>
            <CustomerSelect message={message} disabled={false} />
          </div>
          {showLimitActivities && (
            <div style={{ width: '45%' }}>
              <LimitActivitiesSelect disabled={false} />
            </div>
          )}
          {showTimeRange && (
            <div style={{ width: '45%' }}>
              <DateRange disabled={false} />
            </div>
          )}
        </Flex>

        {!isViewMode && (
          <Flex justify="flex-end" style={{ marginTop: '16px' }}>
            <Button type="primary" htmlType="submit" loading={isSubmitting}>
              Update
            </Button>
          </Flex>
        )}
      </form>
    </FormProvider>
  )
}

export default CustomerJourneyConfig
