import { PlusOutlined } from '@ant-design/icons'
import { Button, Space } from 'antd-next'
import { Title } from 'components/Datasets/BuildDataset/tools/shared'
import { ColumnSelect, NumberField, StringField } from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm'
import { Box, ListItemCard } from 'components/shared/jawns'
import React from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { NUMBER_COLUMN_TYPES } from 'util/datasets'

const Bin = () => {
  const { control } = useFormContext()
  const {
    fields: binsFields,
    append,
    remove,
  } = useFieldArray({
    control,
    name: 'source_details.bins',
  })

  // Always want an option open by default
  if (binsFields.length === 0) {
    append({ from_value: null, to_value: null, name: null })
  }

  return (
    <>
      <Title>Group values from the following number column</Title>
      <Box>
        <ColumnSelect
          columnTypes={NUMBER_COLUMN_TYPES}
          placeholder="Select number column"
          labelText="Number column"
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: component is JS and this prop isn't typed correctly as `undefined`
          defaultNthOptionWithFilter={{ index: 0 }}
        />
      </Box>

      {binsFields.map((fieldName, index) => (
        <ListItemCard key={fieldName.id} onClose={() => remove(index)} removable={index > 0}>
          <Space align="start">
            <NumberField labelText="From" fieldName={`source_details.bins.${index}.from_value`} />
            <NumberField labelText="To" fieldName={`source_details.bins.${index}.to_value`} />
            <StringField labelText="Label" fieldName={`source_details.bins.${index}.name`} />
          </Space>
        </ListItemCard>
      ))}

      <Box mb={3}>
        <Button
          type="dashed"
          shape="round"
          icon={<PlusOutlined />}
          onClick={() => append({ from_value: null, to_value: null, name: `Bin ${binsFields.length}` })}
        >
          Add another bin
        </Button>
      </Box>

      <StringField labelText="Other Label" fieldName="source_details.else_name" />
    </>
  )
}

export default Bin
