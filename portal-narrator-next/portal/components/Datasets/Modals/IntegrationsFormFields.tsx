import { DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { Button, Empty, Form as AntForm, Input, InputNumber, Popconfirm, Tooltip } from 'antd-next'
import { FormItem, SearchSelect } from 'components/antd/staged'
import { COMPANY_ADMIN_ONLY_NOTICE } from 'components/context/auth/protectedComponents'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { Box, Condition, Flex, Typography } from 'components/shared/jawns'
import CronSelectFormItem from 'components/shared/jawns/forms/CronSelectFormItem'
import { compact, find, get, includes, isEmpty, map, snakeCase } from 'lodash'
import { FC } from 'react'
import { Field } from 'react-final-form'
import { FieldArray } from 'react-final-form-arrays'
import { colors } from 'util/constants'
import { COLUMN_TYPE_TIMESTAMP, getGroupColumns } from 'util/datasets'
import { IDatasetQueryDefinition } from 'util/datasets/interfaces'
import {
  INTEGRATION_TYPE_CSV,
  INTEGRATION_TYPE_KLAVIYO,
  INTEGRATION_TYPE_MATERIALIZED,
  INTEGRATION_TYPE_POSTMARK,
  INTEGRATION_TYPE_SHEETS,
  INTEGRATION_TYPE_TEXT,
  INTEGRATION_TYPE_VIEW,
  INTEGRATION_TYPE_WEBHOOK,
  NON_COMPANY_ADMIN_INTEGRATION_TYPES,
} from 'util/datasets/v2/integrations/constants'
import { getIntegrationConfig } from 'util/datasets/v2/integrations/helpers'
import { cronValidator, isValidKlaviyoListUrl, isValidWebhookUrl, required } from 'util/forms'

import AddIntegrationButton from './AddIntegrationButton'
import IntegrationUserIdsSelect from './IntegrationUserIdsSelect'
import PostmarkIntegrationFields from './PostmarkIntegrationFields'
import WebhookIntegrationFields from './WebhookIntegrationFields'

const { TextArea } = Input

interface Props {
  queryDefinition?: IDatasetQueryDefinition
}

// we need to set group_slug to null if we want to select the "parent" dataset, this is just a placeholder:
export const PARENT_DATASET_GROUP_SLUG_VALUE = '__PARENT__'

const makeLabelHelpText = (labelValue: string, integrationType: string, materializeSchema?: string | null) => {
  if (integrationType === INTEGRATION_TYPE_SHEETS) {
    return `The new sheet will be called: ${snakeCase(labelValue)}`
  }

  // Example: dw_mvs.v_example_view
  if (integrationType === INTEGRATION_TYPE_VIEW) {
    return `A view in your warehouse will be called: ${materializeSchema}.v_${snakeCase(labelValue)}`
  }

  // Example: dw_mvs.example_materialized_view
  if (integrationType === INTEGRATION_TYPE_MATERIALIZED) {
    return `The materialized view in your warehouse will be called: ${materializeSchema}.mv_${snakeCase(labelValue)}`
  }

  return undefined
}

const layout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 18 },
}
const tailLayout = {
  wrapperCol: { offset: 6, span: 18 },
}

const IntegrationsFormFields: FC<Props> = ({ queryDefinition }) => {
  const company = useCompany()
  const { isCompanyAdmin } = useUser()

  return (
    <FieldArray name="materializations">
      {({ fields }) => {
        const groupByOptions = map(queryDefinition?.query.all_groups, (val) => ({
          label: val.name,
          value: val.slug,
          optGroupBy: 'Group Bys',
        }))

        const parentGroupOptions = [
          { label: 'Parent Dataset', value: PARENT_DATASET_GROUP_SLUG_VALUE, optGroupBy: 'Raw Dataset' },
          ...groupByOptions,
        ]

        if (fields.length === 0) {
          return (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="This dataset has no integrations"
              data-test="no-integrations-warning"
            >
              <AddIntegrationButton />
            </Empty>
          )
        }

        return (
          <AntForm {...layout}>
            {fields.map((fieldName, index) => {
              const integrationType = get(fields.value[index], 'type')
              const notAllowedToAccess =
                !isCompanyAdmin && !includes(NON_COMPANY_ADMIN_INTEGRATION_TYPES, integrationType)

              return (
                <Box mb={5} key={fieldName} data-test="integration-form-field">
                  <FormItem
                    compact
                    help={integrationType === INTEGRATION_TYPE_TEXT ? '(SMS messages are limited to 40 rows)' : null}
                    {...tailLayout}
                  >
                    <Flex justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography type="title400" data-public>
                        {getIntegrationConfig(integrationType).displayName}
                      </Typography>

                      <Popconfirm
                        placement="topRight"
                        title="Are you sure you want to delete this integration?"
                        onConfirm={() => fields.remove(index)}
                        okText="Yes"
                        okButtonProps={{ 'data-test': 'confirm-delete-integration-cta' }}
                        cancelText="No"
                        disabled={notAllowedToAccess}
                      >
                        {notAllowedToAccess ? (
                          <Tooltip title={COMPANY_ADMIN_ONLY_NOTICE}>
                            <Button danger disabled icon={<DeleteOutlined />} data-test="delete-integration-cta" />
                          </Tooltip>
                        ) : (
                          <Button danger icon={<DeleteOutlined />} data-test="delete-integration-cta" />
                        )}
                      </Popconfirm>
                    </Flex>
                  </FormItem>
                  <Box>
                    <Box>
                      <Field
                        name={`${fieldName}.label`}
                        validate={required}
                        render={({ input, meta }) => (
                          <FormItem
                            label="Pretty Name"
                            meta={meta}
                            required
                            hasFeedback
                            help={makeLabelHelpText(input.value, integrationType, company.materialize_schema)}
                          >
                            <Input
                              disabled={notAllowedToAccess}
                              placeholder="Pretty Name"
                              {...input}
                              data-test="integration-form-field-label-input"
                            />
                          </FormItem>
                        )}
                      />
                    </Box>

                    <Box>
                      <Field
                        // use fieldName instead of ${fieldName}.group_slug because we need to
                        // override the column_id sibling value onChange
                        name={fieldName}
                        validate={required}
                        render={({ input, meta }) => {
                          // Clear out column_id (for INTEGRATION_TYPE_MATERIALIZED)
                          const onChange = (val: any) =>
                            input.onChange({
                              ...input.value,
                              // group_slug should be empty when parent is selected:
                              group_slug: val === PARENT_DATASET_GROUP_SLUG_VALUE ? null : val,
                              column_id: null,
                            })

                          return (
                            <FormItem label="Parent or Group" meta={meta} required>
                              <SearchSelect
                                placeholder="Select..."
                                // group_slug should be empty when parent is selected:
                                value={
                                  !input.value.group_slug ? PARENT_DATASET_GROUP_SLUG_VALUE : input.value.group_slug
                                }
                                onChange={onChange}
                                options={parentGroupOptions}
                                isGrouped
                                disabled={
                                  notAllowedToAccess || getIntegrationConfig(integrationType).disableParentGroup
                                }
                              />
                            </FormItem>
                          )
                        }}
                      />
                    </Box>

                    <Condition when={`${fieldName}.type`} isIn={[INTEGRATION_TYPE_MATERIALIZED, INTEGRATION_TYPE_VIEW]}>
                      <Field
                        name={`${fieldName}.webhook_url`}
                        validate={(url: string) => {
                          // not required
                          if (isEmpty(url)) {
                            return undefined
                          }

                          // but if entered - make sure it's valid
                          return isValidWebhookUrl(url, 'BI Url requires HTTPS')
                        }}
                        render={({ input, meta }) => (
                          <FormItem
                            label="BI Url"
                            meta={meta}
                            hasFeedback
                            help="This url is not used by Narrator externally. It's only used to make it easier to find and understand dependencies."
                          >
                            <TextArea disabled={notAllowedToAccess} placeholder="BI Url" autoSize {...input} />
                          </FormItem>
                        )}
                      />
                    </Condition>

                    <Condition
                      when={`${fieldName}.type`}
                      isIn={[
                        INTEGRATION_TYPE_MATERIALIZED,
                        INTEGRATION_TYPE_SHEETS,
                        INTEGRATION_TYPE_WEBHOOK,
                        INTEGRATION_TYPE_CSV,
                        INTEGRATION_TYPE_TEXT,
                        INTEGRATION_TYPE_KLAVIYO,
                        INTEGRATION_TYPE_POSTMARK,
                      ]}
                    >
                      <Field
                        name={`${fieldName}.company_task.schedule`}
                        validate={(value) => cronValidator({ value, isRequired: true })}
                        render={({ input: { value, onChange }, meta }) => (
                          <CronSelectFormItem
                            selectProps={{
                              value,
                              onSelect: onChange,
                              getPopupContainer: true,
                              disabled: notAllowedToAccess,
                            }}
                            meta={meta}
                            required
                            hasFeedback
                            label="Repeat Every"
                          />
                        )}
                      />
                    </Condition>

                    <Condition when={`${fieldName}.type`} is={INTEGRATION_TYPE_MATERIALIZED}>
                      <Field
                        name={`${fieldName}.group_slug`}
                        subscription={{ value: true }}
                        render={({ input: { value: groupSlugValue } }) => {
                          const groupSlug = groupSlugValue === PARENT_DATASET_GROUP_SLUG_VALUE ? null : groupSlugValue
                          const group = find(queryDefinition?.query.all_groups, ['slug', groupSlug])
                          const allColumns =
                            groupSlug && group ? getGroupColumns({ group }) : queryDefinition?.query.columns
                          const timeColumns = compact(
                            map(allColumns, (col) => {
                              if (col.type === COLUMN_TYPE_TIMESTAMP) {
                                return col
                              }
                            })
                          )
                          const options = map(timeColumns, (col) => ({ label: col.label, value: col.id }))

                          return (
                            <Field
                              name={`${fieldName}.column_id`}
                              render={({ input, meta }) => (
                                <FormItem
                                  label="Timestamp Col"
                                  meta={meta}
                                  help="This is the timestamp used in the days to resync processing. Leave blank if your dataset doesn't have a timestamp column."
                                >
                                  <SearchSelect
                                    allowClear
                                    disabled={notAllowedToAccess}
                                    placeholder="Select a Timestamp Column"
                                    options={options}
                                    {...input}
                                  />
                                </FormItem>
                              )}
                            />
                          )
                        }}
                      />

                      <Box>
                        <Field
                          name={`${fieldName}.days_to_resync`}
                          render={({ input, meta }) => (
                            <FormItem
                              label="Days To Resync"
                              meta={meta}
                              help="Number of days to look back for updates (i.e. rows older than 'days to resync' will not be updated in the materialized view)"
                            >
                              <InputNumber disabled={notAllowedToAccess} min={0} defaultValue={30} {...input} />
                            </FormItem>
                          )}
                        />
                      </Box>
                    </Condition>

                    <Condition when={`${fieldName}.type`} is={INTEGRATION_TYPE_SHEETS}>
                      <Box>
                        <Field
                          name={`${fieldName}.sheet_key`}
                          validate={required}
                          render={({ input, meta }) => (
                            <FormItem
                              label="Google Sheet Key"
                              meta={meta}
                              required
                              help="This sheet needs to be shared with reports@narrator.ai to work properly."
                            >
                              <Input
                                disabled={notAllowedToAccess}
                                placeholder="Google Sheet Key"
                                {...input}
                                prefix={
                                  <Tooltip title='The spreadsheet key is long sequence of characters in the "key=" attribute of the URL or between the slashes in the URL of the desired spreadsheet.'>
                                    <div>
                                      <Box ml="4px">
                                        <InfoCircleOutlined style={{ color: colors.blue500, fontSize: 12 }} />
                                      </Box>
                                    </div>
                                  </Tooltip>
                                }
                              />
                            </FormItem>
                          )}
                        />
                      </Box>
                    </Condition>

                    <Condition when={`${fieldName}.type`} isIn={[INTEGRATION_TYPE_CSV, INTEGRATION_TYPE_TEXT]}>
                      <IntegrationUserIdsSelect
                        fieldName={fieldName}
                        integrationType={integrationType}
                        notAllowedToAccess={notAllowedToAccess}
                      />
                    </Condition>

                    <WebhookIntegrationFields fieldName={fieldName} notAllowedToAccess={notAllowedToAccess} />

                    <PostmarkIntegrationFields fieldName={fieldName} notAllowedToAccess={notAllowedToAccess} />

                    <Condition when={`${fieldName}.type`} isIn={[INTEGRATION_TYPE_KLAVIYO]}>
                      <Field
                        name={`${fieldName}.webhook_url`}
                        validate={isValidKlaviyoListUrl}
                        render={({ input, meta }) => (
                          <FormItem
                            label="List Url"
                            meta={meta}
                            hasFeedback
                            required
                            help={
                              <Box>
                                <Typography>The url should look like...</Typography>
                                <Typography>Klaviyo: https://www.klaviyo.com/list/FAE343/some-list-name</Typography>
                                <Typography>
                                  Sendgrid: https://mc.sendgrid.com/contacts/lists/1023a0b9-0b0f-4347
                                </Typography>
                              </Box>
                            }
                          >
                            <Input disabled={notAllowedToAccess} placeholder="List Url" {...input} />
                          </FormItem>
                        )}
                      />
                    </Condition>

                    <Condition when={`${fieldName}.type`} isIn={[INTEGRATION_TYPE_KLAVIYO, INTEGRATION_TYPE_POSTMARK]}>
                      <Field
                        name={`${fieldName}.api_key`}
                        render={({ input, meta }) => (
                          <FormItem label="Api Key" meta={meta} hasFeedback required>
                            <Input.Password
                              disabled={notAllowedToAccess}
                              placeholder="Enter Server Api Token"
                              {...input}
                            />
                          </FormItem>
                        )}
                      />
                    </Condition>
                  </Box>
                </Box>
              )
            })}
          </AntForm>
        )
      }}
    </FieldArray>
  )
}

export default IntegrationsFormFields
