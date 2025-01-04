import { DownOutlined, UpOutlined } from '@ant-design/icons'
import { Button, Space } from 'antd-next'
import OutlinedAddButton from 'components/antd/OutlinedAddButton'
import { Title } from 'components/Datasets/BuildDataset/tools/shared'
import { Box, ListItemCard } from 'components/shared/jawns'
import { compact, includes, uniq } from 'lodash'
import { useEffect, useMemo } from 'react'
import {
  Controller,
  useFieldArray,
  UseFieldArrayMove,
  UseFieldArrayRemove,
  useFormContext,
  useFormState,
} from 'react-hook-form'
import { COLUMN_TYPE_COLUMN_ID, COLUMN_TYPE_NULL } from 'util/datasets'
import { IComputedColumnCase } from 'util/datasets/interfaces'

import IftttCase, { DEFAULT_FILTER_CASE } from './IftttCase'
import ValueOutput from './ValueOutput'

const DEFAULT_CASE = {
  filters: [DEFAULT_FILTER_CASE],
  value: '',
  value_kind: '',
}

interface ItemProps {
  fields: any
  index: number
  parentColumnId: string
  move: UseFieldArrayMove
  remove: UseFieldArrayRemove
}

const Item = ({ fields, index, parentColumnId, move, remove }: ItemProps) => {
  const moveContentUp = () => {
    move(index, index - 1)
  }

  const moveContentDown = () => {
    move(index, index + 1)
  }

  const isLast = fields.length && index === fields.length - 1

  return (
    <ListItemCard onClose={() => remove(index)} removable={index > 0} data-test="ifttt-case">
      <Space direction="vertical" size={2} style={{ position: 'absolute', top: '24px', right: '-9px', zIndex: 1 }}>
        {fields.length && index !== 0 && (
          <Button shape="circle" size="small" onClick={moveContentUp} data-test="move-ifttt-case-up">
            <UpOutlined />
          </Button>
        )}
        {fields.length && !isLast && (
          <Button shape="circle" size="small" onClick={moveContentDown} data-test="move-ifttt-case-down">
            <DownOutlined />
          </Button>
        )}
      </Space>
      <IftttCase parentColumnId={parentColumnId} fieldName={`source_details.cases.${index}`} />
    </ListItemCard>
  )
}

const Ifttt = () => {
  const { control, watch, setError, clearErrors } = useFormContext()
  const { errors } = useFormState()

  const { fields, append, move, remove } = useFieldArray({
    control,
    name: 'source_details.cases',
  })

  const sourceDetails = watch('source_details')
  const casesOutputTypes = sourceDetails?.cases?.map((iftttCase: IComputedColumnCase) => iftttCase.value_kind) || []

  const allOutputTypes = useMemo(() => {
    return compact(
      [sourceDetails.value_kind, ...casesOutputTypes].filter(
        // ignore null types and column types (more of a wildcard situation)
        (type) => !includes([COLUMN_TYPE_NULL, COLUMN_TYPE_COLUMN_ID], type)
      )
    )
  }, [casesOutputTypes, sourceDetails?.cases, sourceDetails.value_kind])

  // make sure that all outputs types match (i.e. all strings or all numbers ...)
  useEffect(() => {
    const outputTypesMatch = uniq(allOutputTypes).length <= 1

    // set error if output types don't match
    // and it hasn't been set yet
    if (!outputTypesMatch && !errors?.iftttOutputTypesMismatch) {
      return setError('iftttOutputTypesMismatch', { type: 'custom', message: 'Output types must match' })
    }

    // clear error if output types match
    if (outputTypesMatch && errors?.iftttOutputTypesMismatch) {
      clearErrors('iftttOutputTypesMismatch')
    }
  }, [allOutputTypes, setError, errors, clearErrors])

  // if no cases - add default case
  useEffect(() => {
    if (fields?.length === 0) {
      append(DEFAULT_CASE)
    }
  }, [fields])

  return (
    <Box mb="120px">
      <Controller
        name="id"
        control={control}
        render={({ field }) => (
          <>
            {fields.map((fieldName, index) => (
              <Item
                {...field}
                fields={fields}
                remove={remove}
                index={index}
                parentColumnId={field.value}
                key={fieldName.id}
                move={move}
              />
            ))}

            <Box mb={3}>
              <OutlinedAddButton data-test="add-ifttt-case-cta" onClick={() => append(DEFAULT_CASE)}>
                Add another IF statement
              </OutlinedAddButton>
            </Box>

            <Title>ELSE output this</Title>
            <ValueOutput valueFieldName="source_details" />
          </>
        )}
      />
    </Box>
  )
}

export default Ifttt
