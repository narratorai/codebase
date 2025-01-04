import { CheckCircleOutlined } from '@ant-design/icons'
import { Button } from 'antd-next'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { get, isEmpty } from 'lodash'
import React, { useContext } from 'react'
import { useFormContext, useFormState } from 'react-hook-form'
import { freehandStringToColumnId } from 'util/datasets'

import { KIND_FREEHAND_FUNCTION, KIND_IFTTT } from './computedConstants'

interface Props {
  isEdit: boolean
  handleSubmit: () => void
}

const ComputedCta = ({ isEdit, handleSubmit }: Props) => {
  const { groupSlug, machineCurrent, machineSend } = useContext(DatasetFormContext)

  const { watch, control } = useFormContext()

  const stagedValue = watch()
  const { errors, isValid } = useFormState({ control })

  const hasError = !isEmpty(errors)
  const apiError = machineCurrent.matches({ api: 'error' })
  const validatingFreehandFunction = machineCurrent.matches({ api: 'validating_freehand_function' })

  const stagedValueKind = get(stagedValue, 'source_details.kind')
  const isIfttt = stagedValueKind === KIND_IFTTT.kind
  const isFreehand = stagedValueKind === KIND_FREEHAND_FUNCTION.kind

  ////////// Ifttt specific
  // make sure ifttt has a case selected
  let iftttHasNoCase = false
  if (isIfttt) {
    const cases = get(stagedValue, 'source_details.cases')
    if (isEmpty(cases)) {
      iftttHasNoCase = true
    }
  }

  ////////// Freehand Function specific
  // Show "Validate" button when:
  //
  // Freehand function has failed validation (apiError is present),
  // so they can click it again to keep validating
  //
  // Freehand function raw_string value does not equal the validated value that's
  // in machine context

  if (isFreehand) {
    const freehandRawString = get(stagedValue, 'source_details.raw_string')
    const validateResponse = get(machineCurrent.context, '_edit_context.validate_response', {})
    const notYetValidated = isEmpty(validateResponse) || validateResponse.raw_string !== freehandRawString

    const handleValidate = () => {
      machineSend('VALIDATE_FREEHAND_FUNCTION', {
        freehandString: freehandStringToColumnId(freehandRawString, machineCurrent.context, groupSlug),
        groupSlug,
      })
    }

    // Make the submit button a "Validate" freehand function button!
    if (apiError || notYetValidated) {
      return (
        <Button
          disabled={validatingFreehandFunction || isEmpty(freehandRawString)}
          icon={<CheckCircleOutlined />}
          onClick={handleValidate}
          data-test="validate-freehand-cta"
        >
          Validate
        </Button>
      )
    }
  }

  // don't listen to isValid/iftttHasNoCase for freehand function - we do our own validation
  const disabled = isFreehand
    ? isEmpty(stagedValue.label) || hasError
    : isEmpty(stagedValue.label) || hasError || iftttHasNoCase || !isValid

  return (
    <Button disabled={disabled} onClick={handleSubmit} data-test="add-computed-column-cta">
      {isEdit ? 'Done' : 'Add Column'}
    </Button>
  )
}

export default ComputedCta
