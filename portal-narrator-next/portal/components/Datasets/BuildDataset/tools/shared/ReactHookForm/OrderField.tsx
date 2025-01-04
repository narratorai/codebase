import { ColumnSelect, DirectionSelect } from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm'
import { Box, Flex } from 'components/shared/jawns'
import { isEmpty } from 'lodash'
import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'

interface Props {
  columnFieldName: string
  directionFieldName: string
  omitColumnIds: string[]
  defaultValues?: {
    order?: 'asc' | 'desc'
  }
}

const OrderField = ({ columnFieldName, directionFieldName, omitColumnIds, defaultValues }: Props) => {
  const { watch, setValue } = useFormContext()
  const directionValue = watch(directionFieldName)
  const directionOnChange = (value?: string) => setValue(directionFieldName, value)

  // set default order values if they exist (and value hasn't been set)
  useEffect(() => {
    if (isEmpty(directionValue) && !isEmpty(defaultValues?.order)) {
      directionOnChange(defaultValues?.order)
    }
  }, [defaultValues, directionValue, directionOnChange])

  return (
    <Flex>
      <Box flexGrow={1} mr="16px">
        <ColumnSelect fieldName={columnFieldName} labelText="Select Existing Column" omitColumnIds={omitColumnIds} />
      </Box>
      <DirectionSelect fieldName={directionFieldName} />
    </Flex>
  )
}

export default OrderField
