import { Spin } from 'antd-next'
import { FormItem, SearchSelect } from 'components/antd/staged'
import { useCompany } from 'components/context/company/hooks'
import { useSimpleActivitiesQuery } from 'graph/generated'
import { map } from 'lodash'
import { useFormContext } from 'react-hook-form'

interface Props {
  disabled: boolean
}

const LimitActivitiesSelect = ({ disabled }: Props) => {
  const company = useCompany()
  const { data, loading } = useSimpleActivitiesQuery({ variables: { company_slug: company.slug } })
  const allActivities = data?.all_activities
  const options = map(allActivities, (activity) => ({
    label: activity.name,
    value: activity.slug,
  }))

  const { watch, setValue } = useFormContext()
  const limitActivities = watch('limit_activities')
  const onChange = (value: string[]) => {
    setValue('limit_activities', value, { shouldValidate: true })
  }

  return (
    <FormItem label="Limit Activities" layout="vertical" compact>
      <Spin spinning={loading}>
        <SearchSelect
          mode="multiple"
          value={limitActivities}
          onChange={onChange}
          options={options}
          placeholder="Defaults to no limits"
          disabled={disabled}
        />
      </Spin>
    </FormItem>
  )
}

export default LimitActivitiesSelect
