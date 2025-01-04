import { Typography } from 'components/shared/jawns'
import { includes } from 'lodash'
import { useFormContext } from 'react-hook-form'
import { BEFORE_ACTIVITY_RELATIONSHIPS, RELATIONSHIP_AT_LEAST_TIME } from 'util/datasets'

interface Props {
  fieldName: string
  parentFieldName: string
}

const BeforeOrAfterText = ({ fieldName, parentFieldName }: Props) => {
  const { watch } = useFormContext()
  const timeOptionValue = watch(`${fieldName}.time_option`)
  const relationshipValue = watch(`${parentFieldName}.relationship_slug`)

  if (timeOptionValue !== RELATIONSHIP_AT_LEAST_TIME) {
    return null
  }

  const beforeOrAfterText = includes(BEFORE_ACTIVITY_RELATIONSHIPS, relationshipValue) ? 'before' : 'after'

  // show the after text if it is "at least" time option
  return (
    <Typography type="body50" mt="5px">
      {beforeOrAfterText}
    </Typography>
  )
}

export default BeforeOrAfterText
