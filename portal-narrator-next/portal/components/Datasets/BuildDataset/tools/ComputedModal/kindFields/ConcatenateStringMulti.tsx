import { Title } from 'components/Datasets/BuildDataset/tools/shared'
import { ColumnSelect, StringField } from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm'
import React from 'react'
import { STRING_COLUMN_TYPES } from 'util/datasets'

const ConcatenateStringMulti = () => {
  return (
    <>
      <Title>Take values from</Title>
      <ColumnSelect columnTypes={STRING_COLUMN_TYPES} labelText="String Column" placeholder="Select a String Column" />

      <Title>with delimiter</Title>
      <StringField fieldKey="delimiter" labelText="Delimiter (optional)" isRequired={false} />

      <Title>append values from</Title>
      <ColumnSelect
        columnTypes={STRING_COLUMN_TYPES}
        fieldKey="second_column_id"
        labelText="String Column"
        placeholder="Select a String Column"
      />
    </>
  )
}

export default ConcatenateStringMulti
