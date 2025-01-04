import { FormItem, SearchSelect, SearchSelectOptionProps } from 'components/antd/staged'
import { Controller, useFormContext } from 'react-hook-form'

interface Props {
  handleCreateOptionContent: (args: { searchValue: string; option: SearchSelectOptionProps }) => React.ReactNode
  options: SearchSelectOptionProps[]
}

function StartActivitySelect({ handleCreateOptionContent, options }: Props) {
  const { control } = useFormContext()

  return (
    <Controller
      control={control}
      name="start_activity"
      render={({ field, fieldState: { isTouched, error } }) => (
        <FormItem
          label="View Journey after First"
          meta={{ touched: isTouched, error: error?.message }}
          layout="vertical"
          compact
        >
          <SearchSelect
            {...field}
            data-test="customer-starty-activity-select"
            optionFilterProp="label"
            optionLabelProp="label"
            showSearch
            placeholder="Start Activity"
            style={{ width: '100%' }}
            allowClear
            options={options}
            createOptionContent={handleCreateOptionContent}
          />
        </FormItem>
      )}
    />
  )
}

export default StartActivitySelect
