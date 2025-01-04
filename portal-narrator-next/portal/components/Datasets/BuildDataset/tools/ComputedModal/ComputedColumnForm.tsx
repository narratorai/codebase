import { Box, Typography } from 'components/shared/jawns'
import { find } from 'lodash'
import { semiBoldWeight } from 'util/constants'

import { getAllComputedConfigs } from './computedConstants'
import ComputedCta from './ComputedCta'
import ComputedFormFields from './ComputedFormFields'

interface Props {
  isEdit: boolean
  kind: string
  handleSubmit: () => void
}

const ComputedColumnForm = ({ isEdit, kind, handleSubmit }: Props) => {
  const kinds = getAllComputedConfigs()
  const kindObj = find(kinds, ['kind', kind])

  return (
    <Box>
      <Box mb={2} data-public>
        <Typography type="title400" fontWeight={semiBoldWeight} data-test="computed-column-form-title">
          {kindObj?.label}
        </Typography>
      </Box>
      <ComputedFormFields kind={kind} />
      <Box mt={3}>
        <ComputedCta isEdit={isEdit} handleSubmit={handleSubmit} />
      </Box>
    </Box>
  )
}

export default ComputedColumnForm
