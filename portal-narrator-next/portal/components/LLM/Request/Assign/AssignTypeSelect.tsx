import { FormItem, SearchSelect } from 'components/antd/staged'
import { Control, Controller } from 'react-hook-form'

import { AssignTypes, IFormData } from './interfaces'

interface Props {
  control: Control<IFormData>
  onChange?: (value: AssignTypes) => void
}

const OPTIONS = [
  { label: 'All Admins', value: AssignTypes.all_admins },
  { label: 'Job Titles', value: AssignTypes.job_titles },
  { label: 'Users', value: AssignTypes.users },
]

const AssignTypeSelect = ({ control, onChange }: Props) => {
  const handleOnChange = (value: AssignTypes, fieldOnChange: (value: AssignTypes) => void) => {
    fieldOnChange(value)
    onChange?.(value)
  }

  return (
    <Controller
      name="assign_type"
      control={control}
      render={({ field, fieldState: { isTouched, error } }) => (
        <FormItem label="Segmented by" meta={{ touched: isTouched, error: error?.message }} layout="vertical" compact>
          <SearchSelect
            options={OPTIONS}
            {...field}
            // allow for onChange callback to be called
            onChange={(value: AssignTypes) => handleOnChange(value, field.onChange)}
          />
        </FormItem>
      )}
    />
  )
}

export default AssignTypeSelect
