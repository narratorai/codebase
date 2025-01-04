import { InputNumber } from 'antd-next'
import { FormItem } from 'components/antd/staged'
import { isFinite } from 'lodash'
import { useEffect } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

export const DEFAULT_DEPTH = 10

const DepthInput = () => {
  const { control, watch, setValue } = useFormContext()

  const depth = watch('depth')
  // set default depth if is visualization and no number set
  useEffect(() => {
    if (!isFinite(depth)) {
      setValue('depth', DEFAULT_DEPTH, { shouldValidate: true })
    }
  }, [depth])

  return (
    <Controller
      control={control}
      name="depth"
      render={({ field, fieldState: { isTouched, error } }) => (
        <FormItem compact label="Depth" meta={{ touched: isTouched, error: error?.message }} layout="vertical">
          <InputNumber {...field} min={0} max={25} />
        </FormItem>
      )}
    />
  )
}

export default DepthInput
