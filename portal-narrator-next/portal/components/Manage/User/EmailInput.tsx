import { Input, Spin } from 'antd-next'
import { FormItem } from 'components/antd/staged'
import { useCompany } from 'components/context/company/hooks'
import { useGetCompanyUsersQuery } from 'graph/generated'
import { includes } from 'lodash'
import { Controller, useFormContext } from 'react-hook-form'
import { isEmail } from 'util/forms'

const EmailInput = () => {
  const company = useCompany()
  const { control } = useFormContext()
  const { data: companyUsersData, loading: companyUsersLoading } = useGetCompanyUsersQuery({
    variables: { company_slug: company.slug },
  })

  const companyUsers = companyUsersData?.company_users
  const existingEmails = companyUsers?.map((companyUser) => companyUser.user.email)

  const handleValidate = (email: string) => {
    // check if the user already exists
    if (includes(existingEmails, email)) return 'The user already exists.'

    // then make sure it's a valid email (isEmail also checks required)
    return isEmail(email)
  }

  return (
    <Controller
      control={control}
      name="email"
      rules={{ validate: handleValidate }}
      render={({ field, fieldState: { isTouched: touched, error } }) => (
        <FormItem label="Email" meta={{ touched, error: error?.message }} layout="vertical" compact required>
          <Spin spinning={companyUsersLoading}>
            <Input data-test="add-email-input" {...field} />
          </Spin>
        </FormItem>
      )}
    />
  )
}

export default EmailInput
