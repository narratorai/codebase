import { Controller, useFormContext } from 'react-hook-form'

import Switch from './Switch'

interface Props {
  name: string
}

export default function SwitchController({ name }: Props) {
  const { control } = useFormContext()

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => <Switch checked={field.value} onChange={field.onChange} />}
    />
  )
}
