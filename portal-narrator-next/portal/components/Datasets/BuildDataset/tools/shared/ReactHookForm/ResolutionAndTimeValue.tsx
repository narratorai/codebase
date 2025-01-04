import CompanyTimezoneDatePicker from 'components/antd/CompanyTimezoneDatePicker'
import { SearchSelect } from 'components/antd/staged'
import { map, startCase } from 'lodash'
import { Controller, useFormContext } from 'react-hook-form'
import { DATE_TIME_FIELD_RESOLUTIONS } from 'util/datasets'
import { required } from 'util/forms'

const RESOLUTION_OPTIONS = map(DATE_TIME_FIELD_RESOLUTIONS, (res) => ({ value: res, label: startCase(res) }))

interface Props {
  fieldName: string
  resolution: 'date' | 'date_time' | 'week' | 'month' | 'quarter' | 'year'
  disabled: boolean
  shouldUnregister?: boolean
}

const ResolutionAndTimeValue = ({ fieldName, resolution, disabled, shouldUnregister, ...rest }: Props) => {
  const { control } = useFormContext()

  return (
    <>
      <Controller
        control={control}
        name={`${fieldName}_resolution`}
        shouldUnregister={shouldUnregister}
        render={({ field }) => (
          <SearchSelect
            {...field}
            options={RESOLUTION_OPTIONS}
            popupMatchSelectWidth={false}
            style={{ minWidth: '72px' }}
          />
        )}
      />

      <Controller
        control={control}
        name={fieldName}
        shouldUnregister={shouldUnregister}
        rules={{
          validate: required,
        }}
        render={({ field }) => (
          <CompanyTimezoneDatePicker
            {...field}
            style={{ maxWidth: 160 }}
            resolution={resolution}
            disabled={disabled}
            {...rest}
          />
        )}
      />
    </>
  )
}

export default ResolutionAndTimeValue
