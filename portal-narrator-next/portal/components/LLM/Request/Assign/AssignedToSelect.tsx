import { Spin } from 'antd-next'
import { FormItem, SearchSelect } from 'components/antd/staged'
import { useCompany } from 'components/context/company/hooks'
import JobTitleSelect from 'components/shared/JobTitleSelect'
import { ICompany_User_Role_Enum, useGetCompanyUsersQuery } from 'graph/generated'
import { compact, filter, map, uniq } from 'lodash'
import { Control, Controller } from 'react-hook-form'

import { AssignTypes, IFormData } from './interfaces'

interface Props {
  control: Control<IFormData>
  assignType: keyof typeof AssignTypes
}

const AssignedTypeSelect = ({ control, assignType }: Props) => {
  const company = useCompany()

  // company user options are only to be used by super admins
  const { data: companyUsers, loading: companyUsersLoading } = useGetCompanyUsersQuery({
    variables: { company_slug: company.slug },
  })

  // only show admins in the dropdown options
  const adminCompanyUsers = filter(
    companyUsers?.company_users,
    (companyUser) => companyUser?.role === ICompany_User_Role_Enum.Admin
  )

  const userOptions = map(adminCompanyUsers, (companyUser) => ({
    label: companyUser.user.email,
    value: companyUser.user.id,
  }))

  const allJobTitles = uniq(compact(map(adminCompanyUsers, (companyUser) => companyUser.job_title)))
  const jobTitleOptions = map(allJobTitles, (jobTitle) => ({
    label: jobTitle,
    value: jobTitle,
  }))

  // Create options below, based on assignType
  let options: { label: string; value: string }[] = []
  if (assignType === AssignTypes.users) {
    options = userOptions
  }
  if (assignType === AssignTypes.job_titles) {
    options = jobTitleOptions
  }

  // safety catch, don't show any options if assignType is all_admins
  if (assignType === AssignTypes.all_admins) {
    return null
  }

  const label = `Selected ${assignType === AssignTypes.users ? 'Users' : 'Job Titles'}`

  return (
    <Spin spinning={companyUsersLoading}>
      <Controller
        name="assigned_to"
        control={control}
        render={({ field, fieldState: { isTouched, error } }) => (
          <FormItem label={label} meta={{ touched: isTouched, error: error?.message }} layout="vertical" compact>
            {assignType === AssignTypes.job_titles && (
              <JobTitleSelect {...field} jobTitles={allJobTitles} mode="multiple" />
            )}
            {assignType === AssignTypes.users && <SearchSelect mode="multiple" options={options} {...field} />}
          </FormItem>
        )}
      />
    </Spin>
  )
}

export default AssignedTypeSelect
