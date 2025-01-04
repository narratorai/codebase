import { Collapse, Form as AntForm, Input, Spin } from 'antd-next'
import { Divider, FormItem, SearchSelect } from 'components/antd/staged'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { Box } from 'components/shared/jawns'
import CronSelectFormItem from 'components/shared/jawns/forms/CronSelectFormItem'
import TagSelect from 'components/shared/TagSelect'
import { INarrative_Types_Enum, IStatus_Enum, useGetCompanyUsersQuery, useGetUserQuery } from 'graph/generated'
import { includes, isEmpty, map, startCase } from 'lodash'
import React, { useEffect, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { cronValidator, required } from 'util/forms'
import { getNarrativeStateLabel } from 'util/narratives'

const { TextArea } = Input

interface Props {
  canArchive: boolean
  loading: boolean
}

const TYPE_OPTIONS = [
  { label: startCase(INarrative_Types_Enum.Analysis), value: INarrative_Types_Enum.Analysis },
  { label: startCase(INarrative_Types_Enum.Dashboard), value: INarrative_Types_Enum.Dashboard },
]

interface IUserOption {
  value: string
  label: string
}

const SaveNarrativeForm = ({ canArchive, loading }: Props) => {
  const { isSuperAdmin } = useUser()
  const company = useCompany()

  const { control, watch } = useFormContext()

  const narrativeCreatedBy = watch('created_by')
  const selectedState = watch('state')
  const selectedType = watch('type')
  const dashboardOrNarrativeText = selectedType === INarrative_Types_Enum.Dashboard ? 'dashboard' : 'narrative'

  //   // Uncomment when https://app.clubhouse.io/narrator/story/807/bug-depends-on-narrative-needs-graph-permission
  // is resolved
  // const { narratives } = useContext(NarrativeIndexContext)
  const [userOptions, setUserOptions] = useState<IUserOption[]>([])

  const { data: companyUsers, loading: companyUsersLoading } = useGetCompanyUsersQuery({
    variables: { company_slug: company.slug },
  })

  const { data: narrativeCreatedByUserDatta } = useGetUserQuery({
    variables: { user_id: narrativeCreatedBy },
    // skip if there is no created by (it's a new narrative)
    skip: !narrativeCreatedBy,
  })
  const narrativeCreatedByUser = narrativeCreatedByUserDatta?.user[0]

  // set user options for "created_by" (super admin only feature)
  useEffect(() => {
    if (!isEmpty(companyUsers)) {
      let options = map(companyUsers?.company_users || [], (companyUser) => {
        return {
          label: companyUser?.user?.email,
          value: companyUser?.user?.id,
        }
      })

      // if narrativeCreatedByUser isn't a company user (is super admin)
      // add that user to the user options
      if (narrativeCreatedByUser) {
        const userIds = map(options, (option) => option.value)
        if (!includes(userIds, narrativeCreatedByUser.id)) {
          options = [
            ...options,
            {
              value: narrativeCreatedByUser.id,
              label: narrativeCreatedByUser.email,
            },
          ]
        }
      }

      setUserOptions(options)
    }
  }, [companyUsers, narrativeCreatedByUser])

  const stateOptions = [
    {
      label: getNarrativeStateLabel({ state: IStatus_Enum.InProgress }),
      value: IStatus_Enum.InProgress,
    },
    { label: getNarrativeStateLabel({ state: IStatus_Enum.Live }), value: IStatus_Enum.Live },
  ]

  if (canArchive) {
    stateOptions.push({
      label: getNarrativeStateLabel({ state: IStatus_Enum.Archived }),
      value: IStatus_Enum.Archived,
    })
  }

  return (
    <Spin spinning={loading}>
      <AntForm labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
        <Box>
          <Controller
            name="name"
            control={control}
            rules={{
              validate: required,
            }}
            render={({ field, fieldState: { isTouched: touched, error } }) => (
              <FormItem
                meta={{ touched, error: error?.message }}
                label="Name"
                help={
                  narrativeCreatedByUser?.email
                    ? `This ${dashboardOrNarrativeText} was created by ${narrativeCreatedByUser.email}`
                    : undefined
                }
                required
                hasFeedback
              >
                <Input
                  placeholder={`Enter Name for ${startCase(dashboardOrNarrativeText)}`}
                  data-test="save-overlay-name-input"
                  {...field}
                />
              </FormItem>
            )}
          />
        </Box>
        <Box>
          <Controller
            name="description"
            control={control}
            render={({ field, fieldState: { isTouched: touched, error } }) => (
              <FormItem label="Description" meta={{ touched, error: error?.message }}>
                <TextArea placeholder={`Enter Description for  ${startCase(dashboardOrNarrativeText)}`} {...field} />
              </FormItem>
            )}
          />
        </Box>

        <Box>
          <Controller
            name="state"
            control={control}
            render={({ field, fieldState: { isTouched: touched, error } }) => (
              <FormItem label="State" meta={{ touched, error: error?.message }} required>
                <SearchSelect placeholder="Select a State" options={stateOptions} {...field} />
              </FormItem>
            )}
          />
        </Box>

        {selectedState === IStatus_Enum.Live && (
          <Box>
            <TagSelect fieldName="share_with_tag_ids" />
          </Box>
        )}

        {(selectedState === IStatus_Enum.Live || selectedState === IStatus_Enum.InProgress) && (
          <Box flexGrow={1}>
            <Controller
              name="company_task.schedule"
              control={control}
              rules={{
                validate: (value) => cronValidator({ value, isRequired: false }) || undefined,
              }}
              render={({ field, fieldState: { isTouched: touched, error } }) => (
                <CronSelectFormItem
                  {...field}
                  selectProps={{
                    value: field.value,
                    onSelect: field.onChange,
                    getPopupContainer: true,
                    allowClear: true,
                  }}
                  meta={{ touched, error: error?.message }}
                  label="Schedule Run"
                  required
                  hasFeedback
                />
              )}
            />
          </Box>
        )}

        {/* SUPER ADMIN ONLY BELOW!!! */}
        {isSuperAdmin && (
          <Box mt={4}>
            <Divider />
            <Collapse ghost>
              <Collapse.Panel key="super-admin-only-actions" header="Super Admin Only">
                <Controller
                  name="type"
                  control={control}
                  render={({ field, fieldState: { isTouched: touched, error } }) => (
                    <FormItem label="Type" meta={{ touched, error: error?.message }}>
                      <SearchSelect options={TYPE_OPTIONS} {...field} />
                    </FormItem>
                  )}
                />

                <Spin spinning={companyUsersLoading}>
                  <Box>
                    <Controller
                      name="requested_by"
                      control={control}
                      render={({ field, fieldState: { isTouched: touched, error } }) => (
                        <FormItem label="Requested by" meta={{ touched, error: error?.message }}>
                          <SearchSelect options={userOptions} {...field} />
                        </FormItem>
                      )}
                    />
                  </Box>
                </Spin>

                <Spin spinning={companyUsersLoading}>
                  <Box>
                    <Controller
                      name="created_by"
                      control={control}
                      render={({ field, fieldState: { isTouched: touched, error } }) => (
                        <FormItem
                          label="Created by"
                          help={`Only super admins can change the owner of the  ${dashboardOrNarrativeText}`}
                          meta={{ touched, error: error?.message }}
                        >
                          <SearchSelect options={userOptions} {...field} />
                        </FormItem>
                      )}
                    />
                  </Box>
                </Spin>
              </Collapse.Panel>
            </Collapse>
          </Box>
        )}
      </AntForm>
    </Spin>
  )
}

export default SaveNarrativeForm
