import { Select } from 'antd-next'
import { useGetCompanyUsersQuery } from 'graph/generated'

import { useCompany } from '../../context/company/hooks'

interface Props extends React.ComponentProps<typeof Select> {
  id: string
}

export default function CompanyUserSelect(props: Props) {
  const company = useCompany()
  const { data: companyUserData, loading } = useGetCompanyUsersQuery({
    variables: { company_slug: company?.slug },
  })

  const options =
    companyUserData?.company_users.map((companyUser) => ({
      value: companyUser.user_id,
      label: companyUser.user.email,
    })) || []

  return (
    <Select
      loading={loading}
      options={options}
      filterOption={(input, option) => (option?.label ?? '').includes(input)}
      showSearch
      {...props}
    />
  )
}
