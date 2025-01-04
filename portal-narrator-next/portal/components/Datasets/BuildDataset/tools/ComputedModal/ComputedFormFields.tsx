import { Input } from 'antd-next'
import { FormItem } from 'components/antd/staged'
import { find } from 'lodash'
import React, { useEffect } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { required } from 'util/forms'

import { getAllComputedConfigs } from './computedConstants'
import FIELD_LIST from './kindFields/fieldList'

interface Props {
  kind: string
}

const ComputedFormFields = ({ kind }: Props) => {
  const { setValue, control, watch } = useFormContext()

  const sourceDetailsValue = watch('source_details')

  // set FieldComponent by formstate (not props)
  // to avoid race case between useEffect below
  // and setting default values in children inputs
  let FieldComponent = FIELD_LIST[sourceDetailsValue?.kind]

  // unless it's an append column - which will always be freehand function
  const isAppendComputedColumn = sourceDetailsValue?.activity_kind === 'append'
  if (isAppendComputedColumn) {
    FieldComponent = FIELD_LIST[kind]
  }

  useEffect(() => {
    // 'append' columns with edit are always 'freehand_functions', but don't have kind as 'freehand_function'
    // set in ComputedOverlay as 'kindOverride'

    // set kind and type if kind has changed (and not an 'append' column)
    if (kind && kind !== sourceDetailsValue?.kind && !isAppendComputedColumn) {
      const kinds = getAllComputedConfigs()
      const kindObj = find(kinds, ['kind', kind])

      // Clear out source details with new kind obj:
      setValue('source_details', { kind }, { shouldValidate: true })
      // Set column to the proper type:
      setValue('type', kindObj.columnType, { shouldValidate: true })
    }
  }, [kind, sourceDetailsValue, setValue, isAppendComputedColumn])

  return (
    <>
      <Controller
        name="label"
        control={control}
        rules={{ validate: required }}
        render={({ field, fieldState: { isTouched: touched, error } }) => (
          <FormItem
            label="Column Name"
            meta={{ touched, error: error?.message }}
            layout="vertical"
            data-test="edit-computed-column-name"
            required
            hasFeedback
          >
            <Input placeholder="Enter column name" {...field} />
          </FormItem>
        )}
      />

      {FieldComponent && <FieldComponent />}
    </>
  )
}

export default ComputedFormFields
