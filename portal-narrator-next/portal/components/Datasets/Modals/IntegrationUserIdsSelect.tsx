import { Spin } from 'antd-next'
import { FormItem, SearchSelect } from 'components/antd/staged'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { Box, Link, Typography } from 'components/shared/jawns'
import { useGetCompanyUsersQuery } from 'graph/generated'
import { filter, isEmpty, map } from 'lodash'
import { useEffect, useState } from 'react'
import { Field, useField } from 'react-final-form'
import { INTEGRATION_TYPE_CSV, INTEGRATION_TYPE_TEXT } from 'util/datasets/v2/integrations/constants'
import { required } from 'util/forms'
import { userNameIfExists } from 'util/helpers'

interface Props {
  fieldName: string
  integrationType: typeof INTEGRATION_TYPE_CSV | typeof INTEGRATION_TYPE_TEXT
  notAllowedToAccess: boolean
}

const IntegrationUserIdsSelect = ({ fieldName, integrationType, notAllowedToAccess }: Props) => {
  const { user, companyUser } = useUser()
  const company = useCompany()
  const [hasLoaded, setHasLoaded] = useState(false)

  const {
    input: { value: userIds, onChange: onChangeUserIds },
  } = useField(`${fieldName}.user_ids`)

  const { data: companyUsersData, loading: companyUsersLoading } = useGetCompanyUsersQuery({
    variables: { company_slug: company.slug },
  })
  const companyUsers = companyUsersData?.company_users
  const isEmailCsv = integrationType === INTEGRATION_TYPE_CSV

  // create options for email or text
  let options = isEmailCsv
    ? map(companyUsers, (user) => ({
        label: user?.user?.email as string | null,
        value: user?.id,
      }))
    : map(companyUsers, (user) => ({
        label: userNameIfExists(user),
        value: user?.id,
        disabled: isEmpty(user.phone),
      }))

  // filter out options that are missing label or value
  options = filter(options, (op) => !isEmpty(op.label) && !isEmpty(op.value))

  // when initializing an email or text CSV
  // use this value (if text make sure there is a phone number before)
  // (see useEffect below)
  const defaultOption = isEmailCsv
    ? { label: user.email, value: companyUser?.id }
    : { label: `${companyUser?.first_name} ${companyUser?.last_name}`, value: companyUser?.id }

  const label = isEmailCsv ? 'User Emails' : 'User Phone Numbers'

  useEffect(() => {
    // set companyUser id as default value (only once) if it is blank
    // and there is a valid default option
    if (isEmpty(userIds) && !hasLoaded && options) {
      // if there is a label and a value
      // set default value once and don't try again
      if (!isEmpty(defaultOption.label) && !isEmpty(defaultOption.value)) {
        // if text - make sure the user has a phone number before setting default option
        if (!isEmailCsv) {
          if (!isEmpty(companyUser?.phone)) {
            onChangeUserIds([defaultOption.value])
          }
        } else {
          // it's an email (all users have emails)
          onChangeUserIds([defaultOption.value])
        }

        // only try to set default once
        setHasLoaded(true)
      }
    }
  }, [userIds, onChangeUserIds, hasLoaded, setHasLoaded, options, defaultOption, companyUser])

  return (
    <Box>
      <Field
        name={`${fieldName}.user_ids`}
        validate={required}
        render={({ input, meta }) => {
          return (
            <Spin spinning={companyUsersLoading}>
              <FormItem
                label={label}
                meta={meta}
                required
                help={
                  integrationType === INTEGRATION_TYPE_TEXT ? (
                    <Typography>
                      If a user is disabled it's because they do not have a phone number. Go{' '}
                      <Link to="/manage/users" target="_blank">
                        here
                      </Link>{' '}
                      to add a phone number to receive texts.
                    </Typography>
                  ) : undefined
                }
              >
                <SearchSelect
                  mode="multiple"
                  placeholder="Select..."
                  options={options}
                  disabled={notAllowedToAccess}
                  {...input}
                />
              </FormItem>
            </Spin>
          )
        }}
      />
    </Box>
  )
}

export default IntegrationUserIdsSelect
