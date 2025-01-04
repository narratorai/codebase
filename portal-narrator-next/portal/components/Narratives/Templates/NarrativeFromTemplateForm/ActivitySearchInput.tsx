import { SelectProps } from 'antd/es/select'
import { FormItem } from 'components/antd/staged'
import { useCompany } from 'components/context/company/hooks'
import ActivitySelect from 'components/shared/ActivitySelect/ActivitySelect'
import { IActivity, useListActivitiesQuery } from 'graph/generated'
import React from 'react'
import { useField } from 'react-final-form'
import { required } from 'util/forms'

interface ActivitySearchInputProps extends SelectProps<any> {
  label?: React.ReactNode
  fieldName: string
}

// FIXME - how do we handle multiple activity streams???
const ActivitySearchInput: React.FC<ActivitySearchInputProps> = ({ label, fieldName, ...selectProps }) => {
  const company = useCompany()
  const { data, loading } = useListActivitiesQuery({
    variables: {
      activity_stream: company.tables[0].activity_stream,
      company_slug: company.slug,
    },
  })

  const { input, meta } = useField(fieldName, { validate: required })

  return (
    <FormItem layout="vertical" label={label} hasFeedback={loading} validateStatus="validating" meta={meta}>
      <ActivitySelect activities={(data?.all_activities || []) as IActivity[]} {...input} {...selectProps} />
    </FormItem>
  )
}

export default ActivitySearchInput
