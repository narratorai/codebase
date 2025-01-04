import { Spin } from 'antd-next'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { Title } from 'components/Datasets/BuildDataset/tools/shared'
import MachineError from 'components/Datasets/BuildDataset/tools/shared/MachineError'
import { Typography } from 'components/shared/jawns'
import { get } from 'lodash'
import React, { Suspense, useContext, useEffect } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { freehandStringToColumnId, freehandStringToColumnName } from 'util/datasets'

const FreehandEditor = React.lazy(() => import(/* webpackChunkName: "freehand-editor" */ '../FreehandEditor'))

const RAW_STRING_FIELDNAME = 'source_details.raw_string'

const FreehandFunction = () => {
  const { control, watch, setValue } = useFormContext()
  const { groupSlug, machineCurrent } = useContext(DatasetFormContext)
  const apiValidating = machineCurrent.matches({ api: 'validating_freehand_function' })
  const apiError = machineCurrent.matches({ api: 'error' })
  const validateResponse = get(machineCurrent.context, '_edit_context.validate_response', {})
  const validateOutputType = validateResponse.output_type

  // Column type is controlled by what we get back from the validation api:
  const columnType = watch('type')

  const rawString = watch(RAW_STRING_FIELDNAME)
  // transform from what's in the field to user display
  const formattedValue = freehandStringToColumnName(rawString, machineCurrent.context, groupSlug)

  // transform from display to what's stored in the field
  const onChangeRawString = (value?: string) => {
    if (!value) {
      return setValue(RAW_STRING_FIELDNAME, '')
    }

    setValue(RAW_STRING_FIELDNAME, freehandStringToColumnId(value, machineCurrent.context, groupSlug))
  }

  useEffect(() => {
    if (validateOutputType && columnType !== validateOutputType) {
      setValue('type', validateOutputType)
    }
  }, [columnType, setValue, validateOutputType])

  const renderCompiledSqlMessage = () => {
    if (apiValidating) {
      return <Typography color="gray500">Loading...</Typography>
    }

    if (apiError || !validateResponse.column_sql) {
      return <Typography color="gray500">N/A</Typography>
    }

    if (validateResponse.column_sql) {
      return <Typography>{validateResponse.column_sql}</Typography>
    }
  }

  return (
    <Spin spinning={apiValidating}>
      {/* 
          Make sure to not clear out the error if the user X's out the Alert! 
          Hence clearErrorOnClose={false}
        */}
      <MachineError clearErrorOnClose={false} />

      <Controller
        name={RAW_STRING_FIELDNAME}
        control={control}
        // don't validate the field itself
        // allow our validation endpoint to handle that
        render={({ field, fieldState: { isTouched: touched, error } }) => (
          <Suspense fallback={null}>
            <FreehandEditor
              {...field}
              value={formattedValue}
              onChange={onChangeRawString}
              meta={{ touched, error: error?.message }}
            />
          </Suspense>
        )}
      />

      <Title>Compiled Sql</Title>
      {renderCompiledSqlMessage()}
    </Spin>
  )
}

export default FreehandFunction
