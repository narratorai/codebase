import { FormItem, SearchSelect } from 'components/antd/staged'
import { useCompany } from 'components/context/company/hooks'
import { FormData } from 'components/CustomerJourney/v2/Customer'
import { Controller, useFormContext } from 'react-hook-form'
import { required } from 'util/forms'
import { persistActivityStream } from 'util/persistActivityStream'

interface Props {
  handleReset: ({ valueOverrides }: { valueOverrides?: Partial<FormData> }) => void
}

const ActivityStreamSelect = ({ handleReset }: Props) => {
  const company = useCompany()
  const { control, watch } = useFormContext()

  const streamSelectOptions = company?.tables?.map((table) => ({
    label: table.identifier,
    value: table.activity_stream,
  }))

  // maintain these values when changing the activity stream
  const onlyFirstOccurrence = watch('only_first_occurrence')
  const timeFilter = watch('time_filter')
  const asc = watch('asc')
  const asVisual = watch('as_visual')

  // clear out activity stream specific fields (i.e. activities, customer)
  // and refetch the customer journey
  const handleActivityStreamChange = (table: string) => {
    handleReset({
      valueOverrides: {
        table,
        only_first_occurrence: onlyFirstOccurrence,
        time_filter: timeFilter,
        asc,
        as_visual: asVisual,
      },
    })

    persistActivityStream(table)
  }

  return (
    <Controller
      control={control}
      name="table"
      rules={{ validate: required }}
      render={({ field, fieldState: { isTouched, error } }) => (
        <FormItem
          label="Select Activity Stream"
          meta={{ touched: isTouched, error: error?.message }}
          layout="vertical"
          compact
        >
          <SearchSelect
            data-test="customer-journey-activity-stream-select"
            popupMatchSelectWidth={false}
            style={{ flex: 1, width: '100%' }}
            options={streamSelectOptions}
            {...field}
            value={field.value}
            onChange={handleActivityStreamChange}
          />
        </FormItem>
      )}
    />
  )
}

export default ActivityStreamSelect
