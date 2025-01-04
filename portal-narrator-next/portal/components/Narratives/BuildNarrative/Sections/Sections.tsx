import { Box } from 'components/shared/jawns'
import { FieldArray } from 'react-final-form-arrays'

import SectionContent from './SectionContent'

export const Sections = () => {
  return (
    <FieldArray name="narrative.sections" subscription={{ length: true }}>
      {({ fields: fieldNames }) => (
        <Box>
          {fieldNames.map((fieldName, index) => (
            <div key={`${fieldName}.${index}`}>
              <SectionContent fieldNames={fieldNames} fieldName={fieldName} index={index} />
            </div>
          ))}
        </Box>
      )}
    </FieldArray>
  )
}

export default Sections
