import TemplateContext from 'components/Narratives/Templates/TemplateContext'
import { Box, Typography } from 'components/shared/jawns'
import { pick } from 'lodash'
import { useContext } from 'react'
import { FieldArray } from 'react-final-form-arrays'

import ActivitySearchInput from './ActivitySearchInput'
import TemplateFormContent from './TemplateFormContent'

const ActivityMapping = () => {
  const { machineCurrent, machineSend } = useContext(TemplateContext)
  const initialValues = pick(machineCurrent.context, ['activity_mapping'])

  const handleSubmit = (values: unknown) => {
    machineSend('NEXT_STEP', values)
  }

  return (
    <TemplateFormContent title="Choose your activities" onSubmit={handleSubmit} initialValues={initialValues}>
      <FieldArray name="activity_mapping">
        {({ fields }) =>
          fields.map((mappingFieldName, index) => {
            const mappingValue = machineCurrent.context.activity_mapping[index]

            return (
              <Box mb={6} key={mappingFieldName}>
                <ActivitySearchInput
                  getPopupContainer={(trigger) => trigger.parentNode}
                  fieldName={`${mappingFieldName}.new_id`}
                  size="large"
                  label={
                    <Typography type="title300" mb={1}>
                      {mappingValue.question}
                    </Typography>
                  }
                />
              </Box>
            )
          })
        }
      </FieldArray>
    </TemplateFormContent>
  )
}

export default ActivityMapping
