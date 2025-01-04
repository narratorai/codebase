import { Box, Flex } from 'components/shared/jawns'
import { isEmpty } from 'lodash'
import React, { useEffect } from 'react'
import { useField } from 'react-final-form'

import ColumnSelect from './ColumnSelect'
import DirectionSelect from './DirectionSelect'

interface Props {
  columnFieldName: string
  directionFieldName: string
  omitColumnIds: string[] | number[]
  defaultValues?: {
    order?: 'asc' | 'desc'
  }
  asCard?: boolean
}

const OrderField = ({ columnFieldName, directionFieldName, omitColumnIds, defaultValues, asCard }: Props) => {
  const {
    input: { value: directionValue, onChange: directionOnChange },
  } = useField(directionFieldName, { subscription: { value: true } })

  // set default order values if they exist (and value hasn't been set)
  useEffect(() => {
    if (isEmpty(directionValue) && !isEmpty(defaultValues?.order)) {
      directionOnChange(defaultValues?.order)
    }
  }, [defaultValues, directionValue, directionOnChange])

  return (
    <Flex>
      <Box flexGrow={1} mr="16px" style={{ maxWidth: asCard ? '303px' : '336px' }}>
        <ColumnSelect fieldName={columnFieldName} labelText="Select Existing Column" omitColumnIds={omitColumnIds} />
      </Box>
      <DirectionSelect fieldName={directionFieldName} />
    </Flex>
  )
}

export default OrderField
