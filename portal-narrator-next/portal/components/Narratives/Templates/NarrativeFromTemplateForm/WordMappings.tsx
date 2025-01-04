import { Input } from 'antd-next'
import { FormItem } from 'components/antd/staged'
import TemplateContext from 'components/Narratives/Templates/TemplateContext'
import { Box, Typography } from 'components/shared/jawns'
import { pick } from 'lodash'
import { useContext } from 'react'
import { Field } from 'react-final-form'
import { FieldArray } from 'react-final-form-arrays'
import { required } from 'util/forms'

import TemplateFormContent from './TemplateFormContent'

const WordMappings = () => {
  const { machineCurrent, machineSend } = useContext(TemplateContext)

  const handleSubmit = (values: unknown) => {
    machineSend('CREATE_NARRATIVE', values)
  }

  const initialValues = pick(machineCurrent.context, ['word_mappings'])

  return (
    <TemplateFormContent title="Customize Language" onSubmit={handleSubmit} initialValues={initialValues}>
      <FieldArray name="word_mappings">
        {({ fields }) => {
          return fields.map((mappingFieldName, index) => {
            const mappingValue = machineCurrent.context.word_mappings[index]

            return (
              <Box mb={6} key={mappingFieldName}>
                <Field
                  name={`${mappingFieldName}.new_id`}
                  validate={required}
                  render={({ input, meta }) => (
                    <FormItem
                      meta={meta}
                      layout="vertical"
                      label={
                        <Typography type="title300" mb={1}>
                          {mappingValue.question}
                        </Typography>
                      }
                      hasFeedback
                    >
                      <Input size="large" {...input} />
                    </FormItem>
                  )}
                />
              </Box>
            )
          })
        }}
      </FieldArray>
    </TemplateFormContent>
  )
}

export default WordMappings
