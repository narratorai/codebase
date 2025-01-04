import { Select } from 'antd-next'
import { FormItem } from 'components/antd/staged'
import TemplateContext from 'components/Narratives/Templates/TemplateContext'
import { Box, Typography } from 'components/shared/jawns'
import { find, pick } from 'lodash'
import { useContext } from 'react'
import { Field } from 'react-final-form'
import { FieldArray } from 'react-final-form-arrays'
import { required } from 'util/forms'

import TemplateFormContent from './TemplateFormContent'

const DatasetFeatureMapping = () => {
  const { machineCurrent, machineSend } = useContext(TemplateContext)

  const initialValues = pick(machineCurrent.context, ['dataset_feature_mapping'])
  const featureMappingOptions = machineCurrent.context._feature_mapping_options

  const handleubmit = (values: unknown) => {
    machineSend('NEXT_STEP', values)
  }

  return (
    <TemplateFormContent title="Choose your features" onSubmit={handleubmit} initialValues={initialValues}>
      <FieldArray name="dataset_feature_mapping">
        {({ fields }) =>
          fields.map((mappingFieldName, index) => {
            const mappingValue = machineCurrent.context.dataset_feature_mapping[index]
            const { options } = find(featureMappingOptions, ['feature_mapping_old_id', mappingValue.old_id]) || {}

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
                    >
                      <Select
                        showSearch
                        size="large"
                        optionFilterProp="label"
                        options={options}
                        getPopupContainer={(trigger) => trigger.parentNode}
                        {...input}
                      />
                    </FormItem>
                  )}
                />
              </Box>
            )
          })
        }
      </FieldArray>
    </TemplateFormContent>
  )
}

export default DatasetFeatureMapping
