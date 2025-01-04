import { InfoCircleOutlined } from '@ant-design/icons'
import { Collapse, Form as AntForm, Input, Popconfirm, Spin, Switch, Tooltip } from 'antd-next'
import { FormItem, SearchSelect } from 'components/antd/staged'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { Box, Flex, Typography } from 'components/shared/jawns'
import TagSelect from 'components/shared/TagSelect'
import { IStatus_Enum, useGetCompanyUsersQuery, useGetUserQuery } from 'graph/generated'
import { includes, isEmpty, map } from 'lodash'
import React, { useEffect, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import styled from 'styled-components'
import { colors } from 'util/constants'
import { getDatasetStatusDescription, getDatasetStatusLabel, getDatasetStatusOptions } from 'util/datasets'
import { required } from 'util/forms'

const { Panel } = Collapse
const { TextArea } = Input

const ADVANCED_OPTIONS_KEY = 'advanced-options'

const LockDatasetSwitchContainer = styled(Box)`
  .antd5-switch-checked {
    background-color: ${colors.red500};
  }
`

interface IUserOption {
  value: string
  label: string
}

const DatasetFormFields = () => {
  const { isSuperAdmin } = useUser()
  const company = useCompany()
  const [userOptions, setUserOptions] = useState<IUserOption[]>([])

  const { watch, control } = useFormContext()

  const datasetCreatedBy = watch('created_by')
  const datasetStatus = watch('status')
  const datasetHideFromIndex = watch('hide_from_index')
  const datasetLocked = watch('locked')

  // show the share with tags if live or internal only (and behind flag)
  const showShareWithTags = datasetStatus === IStatus_Enum.Live || datasetStatus === IStatus_Enum.InternalOnly

  const statusOptions = getDatasetStatusOptions({ isSuperAdmin })

  // company user options are only to be used by super admins
  const { data: companyUsers, loading: companyUsersLoading } = useGetCompanyUsersQuery({
    variables: { company_slug: company.slug },
  })

  const { data: datasetCreatedByUserData } = useGetUserQuery({
    variables: { user_id: datasetCreatedBy },
  })
  const datasetCreatedByUser = datasetCreatedByUserData?.user[0]

  // set user options for "created_by" (super admin only feature)
  useEffect(() => {
    if (!isEmpty(companyUsers)) {
      // add company users to options
      let options = map(companyUsers?.company_users || [], (companyUser) => {
        return {
          label: companyUser?.user?.email,
          value: companyUser?.user?.id,
        }
      })

      // if datasetCreatedByUser isn't a company user (is super admin)
      // add that user to the user options
      if (datasetCreatedByUser) {
        const userIds = map(options, (option) => option.value)
        if (!includes(userIds, datasetCreatedByUser.id)) {
          options = [
            ...options,
            {
              value: datasetCreatedByUser.id,
              label: datasetCreatedByUser.email,
            },
          ]
        }
      }

      setUserOptions(options)
    }
  }, [companyUsers, datasetCreatedByUser])

  return (
    <AntForm labelCol={{ span: 6 }} wrapperCol={{ span: 18 }} data-test="dataset-form-fields">
      <Box>
        <Controller
          control={control}
          name={'name'}
          rules={{ validate: required }}
          render={({ field, fieldState: { isTouched, error } }) => (
            <FormItem label="Name" meta={{ touched: isTouched, error: error?.message }} required hasFeedback>
              <Input placeholder="Enter Name for Dataset" {...field} />
            </FormItem>
          )}
        />
      </Box>
      <Box>
        <Controller
          control={control}
          name={'description'}
          render={({ field, fieldState: { isTouched, error } }) => (
            <FormItem label="Description" meta={{ touched: isTouched, error: error?.message }}>
              <TextArea placeholder="Enter Description for Dataset" {...field} />
            </FormItem>
          )}
        />
      </Box>

      <Box>
        <Controller
          control={control}
          name={'status'}
          render={({ field, fieldState: { isTouched, error } }) => (
            <FormItem
              label={
                <Flex>
                  <Typography mr={1}>Status</Typography>
                  <Tooltip
                    title={
                      <Box>
                        <Typography>
                          "{getDatasetStatusLabel({ status: IStatus_Enum.Archived })}" -{' '}
                          {getDatasetStatusDescription({ status: IStatus_Enum.Archived })}
                        </Typography>
                        <Typography>
                          "{getDatasetStatusLabel({ status: IStatus_Enum.InProgress })}" -{' '}
                          {getDatasetStatusDescription({ status: IStatus_Enum.InProgress })}
                        </Typography>
                        <Typography>
                          "{getDatasetStatusLabel({ status: IStatus_Enum.Live })}" -{' '}
                          {getDatasetStatusDescription({ status: IStatus_Enum.Live })}
                        </Typography>
                        {isSuperAdmin && (
                          <Typography>
                            "{getDatasetStatusLabel({ status: IStatus_Enum.InternalOnly })}" -{' '}
                            {getDatasetStatusDescription({ status: IStatus_Enum.InternalOnly })}
                          </Typography>
                        )}
                      </Box>
                    }
                  >
                    <div>
                      <InfoCircleOutlined />
                    </div>
                  </Tooltip>
                </Flex>
              }
              meta={{ touched: isTouched, error: error?.message }}
            >
              <SearchSelect
                defaultValue={IStatus_Enum.InProgress}
                placeholder="Select a Status"
                options={statusOptions}
                {...field}
              />
            </FormItem>
          )}
        />
      </Box>

      {/* Show tags (Share with) - for live/internal only datasets */}
      {showShareWithTags && (
        <TagSelect
          fieldName="share_with_tag_ids"
          help={
            <Box>
              <Typography>Tagged datasets will be visible to other users.</Typography>
              <Typography>Datasets with no tags will only be visible to you.</Typography>
            </Box>
          }
        />
      )}

      {/* default open collapse if hide_from_index is true */}
      <Collapse ghost defaultActiveKey={datasetHideFromIndex || datasetLocked ? [ADVANCED_OPTIONS_KEY] : undefined}>
        <Panel header="Advanced Options" key={ADVANCED_OPTIONS_KEY}>
          <Box>
            <Controller
              control={control}
              name={'hide_from_index'}
              render={({ field, fieldState: { isTouched, error } }) => (
                <FormItem
                  label={
                    <Flex>
                      <Box mr={1}>
                        <Typography>Hide from</Typography>
                        <Typography>Index</Typography>
                      </Box>

                      <Tooltip title="Toggles whether you and other users can see this dataset on the index page.">
                        <div>
                          <InfoCircleOutlined />
                        </div>
                      </Tooltip>
                    </Flex>
                  }
                  meta={{ touched: isTouched, error: error?.message }}
                >
                  {/* only show popconfirm when switching to hide */}
                  {!field.value ? (
                    <Popconfirm
                      title={
                        <Box>
                          <Typography>Are you sure you want to hide this dataset from the index page?</Typography>
                          <Typography>It will be hidden from all users, including yourself.</Typography>
                        </Box>
                      }
                      onConfirm={() => {
                        field.onChange(true)
                      }}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Switch checked={!!field.value} checkedChildren="Hide" unCheckedChildren="Show" />
                    </Popconfirm>
                  ) : (
                    <Switch
                      checked={!!field.value}
                      checkedChildren="Hide"
                      unCheckedChildren="Show"
                      onChange={field.onChange}
                    />
                  )}
                </FormItem>
              )}
            />
          </Box>

          <Box>
            <Controller
              control={control}
              name={'locked'}
              render={({ field, fieldState: { isTouched, error } }) => (
                <FormItem
                  label={
                    <Flex>
                      <Typography mr={1}>Lock Dataset</Typography>

                      <Tooltip title="Toggles whether you and other admins can update this dataset.">
                        <div>
                          <InfoCircleOutlined />
                        </div>
                      </Tooltip>
                    </Flex>
                  }
                  meta={{ touched: isTouched, error: error?.message }}
                >
                  {/* only show popconfirm when switching to hide */}
                  {!field.value ? (
                    <Popconfirm
                      title={
                        <Box>
                          <Typography>Are you sure you want to lock this dataset?</Typography>
                          <Typography>No one will be able to update this dataset until it is unlocked.</Typography>
                        </Box>
                      }
                      onConfirm={() => {
                        field.onChange(true)
                      }}
                      okText="Yes"
                      cancelText="No"
                    >
                      <LockDatasetSwitchContainer>
                        <Switch checked={!!field.value} checkedChildren="Locked" unCheckedChildren="Unlocked" />
                      </LockDatasetSwitchContainer>
                    </Popconfirm>
                  ) : (
                    <LockDatasetSwitchContainer>
                      <Switch
                        checked={!!field.value}
                        checkedChildren="Locked"
                        unCheckedChildren="Unlocked"
                        onChange={field.onChange}
                      />
                    </LockDatasetSwitchContainer>
                  )}
                </FormItem>
              )}
            />
          </Box>

          {/* This should ONLY EVER be a super admin ability */}
          {isSuperAdmin && (
            <Spin spinning={companyUsersLoading}>
              <Box>
                <Controller
                  control={control}
                  name={'created_by'}
                  render={({ field, fieldState: { isTouched, error } }) => (
                    <FormItem
                      label="Created by"
                      help="Only super admins can change the owner of the dataset"
                      meta={{ touched: isTouched, error: error?.message }}
                    >
                      <SearchSelect options={userOptions} {...field} />
                    </FormItem>
                  )}
                />
              </Box>
            </Spin>
          )}
        </Panel>
      </Collapse>
    </AntForm>
  )
}

export default DatasetFormFields
