import { FormItem } from 'components/antd/staged'
import { ColumnTypeSelect } from 'components/Datasets/BuildDataset/tools/shared'
import {
  BooleanRadio,
  ColumnSelect,
  DatetimeField,
  NumberField,
  StringField,
} from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm'
import { Box, Flex } from 'components/shared/jawns'
import { isEmpty, isEqual } from 'lodash'
import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import {
  COLUMN_TYPE_BOOLEAN,
  COLUMN_TYPE_COLUMN_ID,
  COLUMN_TYPE_NULL,
  COLUMN_TYPE_NUMBER,
  COLUMN_TYPE_STRING,
  COLUMN_TYPE_TIMESTAMP,
} from 'util/datasets'
import usePrevious from 'util/usePrevious'

interface Props {
  valueFieldName: string
  defaultValues?: {
    valueKind?: string
  }
}

const ValueOutput = ({ valueFieldName, defaultValues }: Props) => {
  const VALUE_FIELDNAME = `${valueFieldName}.value`
  const VALUE_KIND_FIELDNAME = `${valueFieldName}.value_kind`

  const { setValue, watch } = useFormContext()

  const onChangeValue = (value: string | number | boolean | undefined) => setValue(VALUE_FIELDNAME, value)

  const valueKind = watch(VALUE_KIND_FIELDNAME)
  const onChangeValueKind = (value: string) => setValue(VALUE_KIND_FIELDNAME, value)
  const prevValueKind = usePrevious(valueKind)

  // set default values when value kind changes
  useEffect(() => {
    if (prevValueKind && !isEqual(prevValueKind, valueKind)) {
      if (valueKind === COLUMN_TYPE_COLUMN_ID || valueKind === COLUMN_TYPE_TIMESTAMP) {
        onChangeValue(undefined)
      }

      if (valueKind === COLUMN_TYPE_STRING || isEmpty(valueKind)) {
        onChangeValue('')
      }

      if (valueKind === COLUMN_TYPE_NUMBER) {
        onChangeValue(1)
      }

      if (valueKind === COLUMN_TYPE_BOOLEAN) {
        onChangeValue('true')
      }

      if (valueKind === COLUMN_TYPE_NULL) {
        onChangeValue('null')
      }
    }
  }, [prevValueKind, valueKind, onChangeValue])

  // ensure a value kind
  useEffect(() => {
    if (isEmpty(valueKind)) {
      onChangeValueKind(COLUMN_TYPE_STRING)
    }
  }, [valueKind, onChangeValueKind])

  return (
    <Flex>
      <Box width={1 / 3} pr={1} data-test="value-output-type-select">
        <ColumnTypeSelect
          withColumnIdOption
          fieldName={VALUE_KIND_FIELDNAME}
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: component is JS and this prop isn't typed correctly as `undefined`
          defaultValue={defaultValues?.valueKind}
        />
      </Box>
      <Box width={2 / 3} pl={1} data-test="value-output-field">
        {valueKind === COLUMN_TYPE_COLUMN_ID && <ColumnSelect fieldName={VALUE_FIELDNAME} />}

        {(valueKind === COLUMN_TYPE_STRING || valueKind === COLUMN_TYPE_STRING) && (
          <StringField labelText="Enter the value" fieldName={VALUE_FIELDNAME} />
        )}

        {valueKind === COLUMN_TYPE_NUMBER && (
          <NumberField labelText="Enter a Number" fieldName={VALUE_FIELDNAME} defaultValue={1} />
        )}

        {valueKind === COLUMN_TYPE_TIMESTAMP && (
          <FormItem label="Date or Time" layout="vertical" required>
            <Flex>
              <DatetimeField fieldName={VALUE_FIELDNAME} asGroup />
            </Flex>
          </FormItem>
        )}

        {valueKind === COLUMN_TYPE_BOOLEAN && <BooleanRadio fieldName={VALUE_FIELDNAME} />}

        {/* No UI for COLUMN_TYPE_NULL - set value in useEffect */}
      </Box>
    </Flex>
  )
}

export default ValueOutput
