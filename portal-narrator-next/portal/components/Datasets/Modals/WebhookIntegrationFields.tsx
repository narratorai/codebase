import { CloseOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Input, InputNumber, Radio } from 'antd-next'
import { FormItem } from 'components/antd/staged'
import { Box, Condition, Flex } from 'components/shared/jawns'
import { FC } from 'react'
import { Field, useField } from 'react-final-form'
import { FieldArray } from 'react-final-form-arrays'
import styled from 'styled-components'
import {
  INTEGRATION_TYPE_WEBHOOK,
  WEBHOOK_BASIC_AUTH,
  WEBHOOK_BEARER_AUTH,
  WEBHOOK_CUSTOM_HEADERS_AUTH,
  WEBHOOK_NO_AUTH,
} from 'util/datasets/v2/integrations/constants'
import { isValidWebhookUrl, required } from 'util/forms'

const { TextArea } = Input

interface WebhookIntegrationFieldsProps {
  fieldName: string
  notAllowedToAccess: boolean
}

const HoverBox = styled(Box)`
  &:hover {
    cursor: pointer;
  }
`

const WebhookIntegrationFields: FC<WebhookIntegrationFieldsProps> = ({ fieldName, notAllowedToAccess }) => {
  const {
    input: { onChange: customHeadersOnChange },
  } = useField(`${fieldName}.webhook.custom_headers`, { subscription: { value: false } })

  const {
    input: { value: authType },
  } = useField(`${fieldName}.webhook_auth`)

  let authText = ''
  switch (authType) {
    case WEBHOOK_BASIC_AUTH:
      authText = 'Your webhook URL uses basic HTTP authentication.'
      break
    case WEBHOOK_BEARER_AUTH:
      authText = 'Your webhook URL uses an HTTP bearer token header for authentication.'
      break
    case WEBHOOK_CUSTOM_HEADERS_AUTH:
      authText = 'Your webhook URL uses headers for authentication.'
      break
    default:
      authText = 'Your webhook URL does not use any authentication.'
      break
  }

  return (
    <Condition when={`${fieldName}.type`} is={INTEGRATION_TYPE_WEBHOOK}>
      <Box>
        {/* We need to include the secret key in every submit - but don't let user update it */}
        <Field name={`${fieldName}.s3_secret_key`} type="hidden" render={() => null} />

        <Field
          name={`${fieldName}.webhook.rows_per_post`}
          validate={required}
          defaultValue={500}
          render={({ input, meta }) => (
            <FormItem required meta={meta} label="Rows per Post">
              <InputNumber disabled={notAllowedToAccess} min={0} {...input} />
            </FormItem>
          )}
        />
        <Field
          name={`${fieldName}.webhook.max_retry`}
          validate={required}
          defaultValue={50}
          render={({ input, meta }) => (
            <FormItem required meta={meta} label="Max Retries">
              <InputNumber disabled={notAllowedToAccess} min={0} {...input} />
            </FormItem>
          )}
        />

        <Field
          name={`${fieldName}.webhook_url`}
          validate={(value) => isValidWebhookUrl(value, 'Webhook requires valid HTTPS url')}
          render={({ input, meta }) => (
            <FormItem
              label="Webhook Url"
              meta={meta}
              hasFeedback
              required
              help="You are sending your data to an external webhook, please ensure security and safety of the webhook."
            >
              <TextArea disabled={notAllowedToAccess} placeholder="Webhook Url" autoSize {...input} />
            </FormItem>
          )}
        />

        <>
          <Field
            name={`${fieldName}.webhook_auth`}
            validate={required}
            defaultValue={WEBHOOK_NO_AUTH}
            render={({ input, meta }) => {
              const handleChangeRadio = (event: any) => {
                input.onChange(event.target.value)

                // add default field to custom headers
                // doing this here to not get duplicate fields caused by fields.push
                // within custom headers field array below
                if (event.target.value === WEBHOOK_CUSTOM_HEADERS_AUTH) {
                  customHeadersOnChange([{ key: null, value: null }])
                }
              }

              return (
                <FormItem label="Webhook Auth" meta={meta} required help={authText}>
                  <Radio.Group
                    disabled={notAllowedToAccess}
                    onChange={handleChangeRadio}
                    value={input.value}
                    buttonStyle="solid"
                  >
                    <Radio.Button value={WEBHOOK_NO_AUTH}>None</Radio.Button>
                    <Radio.Button value={WEBHOOK_BASIC_AUTH}>Basic Auth</Radio.Button>
                    <Radio.Button value={WEBHOOK_BEARER_AUTH}>Auth Token</Radio.Button>
                    <Radio.Button value={WEBHOOK_CUSTOM_HEADERS_AUTH}>Headers</Radio.Button>
                  </Radio.Group>
                </FormItem>
              )
            }}
          />

          <Condition when={`${fieldName}.webhook_auth`} is={WEBHOOK_BASIC_AUTH}>
            <>
              <Field
                name={`${fieldName}.webhook.user`}
                render={({ input, meta }) => (
                  <FormItem meta={meta} label="User">
                    <Input disabled={notAllowedToAccess} {...input} />
                  </FormItem>
                )}
              />

              <Field
                name={`${fieldName}.webhook.password`}
                render={({ input, meta }) => (
                  <FormItem meta={meta} label="Password">
                    <Input.Password disabled={notAllowedToAccess} {...input} />
                  </FormItem>
                )}
              />
            </>
          </Condition>

          <Condition when={`${fieldName}.webhook_auth`} is={WEBHOOK_BEARER_AUTH}>
            <Field
              name={`${fieldName}.webhook.token`}
              validate={required}
              render={({ input, meta }) => (
                <FormItem meta={meta} label="Token" required hasFeedback>
                  <Input disabled={notAllowedToAccess} {...input} />
                </FormItem>
              )}
            />
          </Condition>

          <Condition when={`${fieldName}.webhook_auth`} is={WEBHOOK_CUSTOM_HEADERS_AUTH}>
            <FormItem label="Headers">
              <FieldArray name={`${fieldName}.webhook.custom_headers`} subscription={{ value: false, length: true }}>
                {({ fields }) => {
                  return (
                    <FormItem>
                      {fields.map((fieldName, index) => {
                        return (
                          <Input.Group key={`${fieldName}.${index}`}>
                            <Flex justifyContent="flex-end" ml="-8px">
                              <Box width="30%" mr={1}>
                                <Field
                                  name={`${fieldName}.key`}
                                  validate={required}
                                  render={({ input, meta }) => (
                                    <FormItem meta={meta} hasFeedback>
                                      <Input placeholder="key" disabled={notAllowedToAccess} {...input} />
                                    </FormItem>
                                  )}
                                />
                              </Box>
                              <Box mr={1} width="60%">
                                <Field
                                  name={`${fieldName}.value`}
                                  validate={required}
                                  render={({ input, meta }) => (
                                    <FormItem meta={meta} hasFeedback>
                                      <Input disabled={notAllowedToAccess} placeholder="value" {...input} />
                                    </FormItem>
                                  )}
                                />
                              </Box>
                              <HoverBox onClick={() => fields.remove(index)} ml="4px">
                                <CloseOutlined />
                              </HoverBox>
                            </Flex>
                          </Input.Group>
                        )
                      })}

                      <Box mb={3}>
                        <Button
                          disabled={notAllowedToAccess}
                          icon={<PlusOutlined />}
                          onClick={() => fields.push({ key: null, value: null })}
                        >
                          Add Key/Value
                        </Button>
                      </Box>
                    </FormItem>
                  )
                }}
              </FieldArray>
            </FormItem>
          </Condition>
        </>
      </Box>
    </Condition>
  )
}

export default WebhookIntegrationFields
