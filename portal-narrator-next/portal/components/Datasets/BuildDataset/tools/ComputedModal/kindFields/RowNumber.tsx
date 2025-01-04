import { GroupColumns, Title } from 'components/Datasets/BuildDataset/tools/shared'
import { OrderColumns } from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm'
import React from 'react'

const RowNumber = () => {
  return (
    <>
      <Title>Create an ordered list based on the following columns</Title>
      <GroupColumns />

      <Title>Order By</Title>
      <OrderColumns defaultValues={{ order: 'asc' }} />
    </>
  )
}

export default RowNumber
