import { Input } from 'antd-next'
import { FormItem } from 'components/antd/staged'
import ColumnSelect from 'components/Datasets/BuildDataset/tools/shared/ColumnSelect'
import { Box, Condition } from 'components/shared/jawns'
import { FC } from 'react'
import { Field } from 'react-final-form'
import { STRING_COLUMN_TYPES } from 'util/datasets'
import { INTEGRATION_TYPE_POSTMARK } from 'util/datasets/v2/integrations/constants'
import { isEmail, required } from 'util/forms'

interface PostmarkIntegrationFieldsProps {
  fieldName: string
  notAllowedToAccess: boolean
}

const PostmarkIntegrationFields: FC<PostmarkIntegrationFieldsProps> = ({ fieldName, notAllowedToAccess }) => {
  return (
    <Condition when={`${fieldName}.type`} is={INTEGRATION_TYPE_POSTMARK}>
      <Box>
        {/* We need to include the secret key in every submit - but don't let user update it */}
        <Field name={`${fieldName}.s3_secret_key`} type="hidden" render={() => null} />

        <Field
          name={`${fieldName}.postmark_from`}
          validate={isEmail}
          render={({ input, meta }) => (
            <FormItem label="From Email" meta={meta} hasFeedback required help="Who the email should be from.">
              <Input disabled={notAllowedToAccess} placeholder="From Email" {...input} />
            </FormItem>
          )}
        />

        {/* <Field
          name={`${fieldName}.column_id`}
          validate={isEmail}
          render={({ input, meta }) => (
            <FormItem label="Send to Email Column" meta={meta} hasFeedback required help="Which column represents the email address you want to send email to?">
              <Input disabled={notAllowedToAccess} placeholder="Send to Email" {...input} />
            </FormItem>
          )}
        /> */}

        <ColumnSelect
          fieldName={`${fieldName}.column_id`}
          columnTypes={STRING_COLUMN_TYPES}
          baseDatasetColumnOptions
          labelText="Send Email Column"
          help="Which column represents the email address you want to send the email to?"
          layout="horizontal"
          inputProps={{ disabled: notAllowedToAccess }}
        />

        <Field
          name={`${fieldName}.template_id`}
          validate={required}
          render={({ input, meta }) => (
            <FormItem
              label="Template Id"
              meta={meta}
              hasFeedback
              required
              help="Which Postmark template id do you want to use?"
            >
              <Input disabled={notAllowedToAccess} placeholder="Template Id" {...input} />
            </FormItem>
          )}
        />
      </Box>
    </Condition>
  )
}

export default PostmarkIntegrationFields
