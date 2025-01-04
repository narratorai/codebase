import { FormItem, SearchSelect } from 'components/antd/staged'
import { Control, Controller } from 'react-hook-form'

import { ApproachTypes, IFormData } from './interfaces'

interface Props {
  control: Control<IFormData>
}

const OPTIONS = [
  { label: 'Least Requests', value: ApproachTypes.least_requests },
  { label: 'Round Robin', value: ApproachTypes.round_robin },
  { label: 'No Auto Assign', value: ApproachTypes.no_auto_assign },
]

const ApproachSelect = ({ control }: Props) => {
  return (
    <Controller
      name="approach"
      control={control}
      render={({ field, fieldState: { isTouched, error } }) => (
        <FormItem
          label="How to auto-assign requests"
          meta={{ touched: isTouched, error: error?.message }}
          layout="vertical"
          compact
        >
          <SearchSelect placeholder="" options={OPTIONS} {...field} />
        </FormItem>
      )}
    />
  )
}

export default ApproachSelect
