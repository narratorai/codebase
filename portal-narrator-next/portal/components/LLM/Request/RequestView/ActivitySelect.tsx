import { PlusOutlined } from '@ant-design/icons'
import { Space, Spin, Tooltip } from 'antd-next'
import { FormItem, SearchSelect } from 'components/antd/staged'
import { useCompany } from 'components/context/company/hooks'
import { Link, Typography } from 'components/shared/jawns'
import { useSimpleActivitiesQuery } from 'graph/generated'
import { map } from 'lodash'
import { Controller, useFormContext } from 'react-hook-form'

interface Props {
  disabled?: boolean
}

const ActivitySelect = ({ disabled }: Props) => {
  const company = useCompany()
  const { data, loading } = useSimpleActivitiesQuery({ variables: { company_slug: company.slug } })
  const allActivities = data?.all_activities
  const options = map(allActivities, (activity) => ({
    label: activity.name,
    value: activity.slug,
  }))

  const { control } = useFormContext()

  return (
    <Space>
      <Spin spinning={loading}>
        <Controller
          name="activity"
          control={control}
          render={({ field, fieldState: { isTouched, error } }) => (
            <FormItem meta={{ touched: isTouched, error: error?.message }} compact>
              <SearchSelect
                {...field}
                options={options}
                placeholder="Select an activity"
                style={{ width: '100%' }}
                popupMatchSelectWidth={false}
                disabled={disabled}
              />
            </FormItem>
          )}
        />
      </Spin>
      <Tooltip
        title={
          <div>
            <Typography>Not seeing the activity you are looking for?</Typography>
            <Typography>Create a new activity here</Typography>
          </div>
        }
      >
        <Link to="/transformations/new" target="_blank">
          <PlusOutlined />
        </Link>
      </Tooltip>
    </Space>
  )
}

export default ActivitySelect
