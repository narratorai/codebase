import { LoadingOutlined } from '@ant-design/icons'
import { Button } from 'antd-next'
import React from 'react'
import { useFormContext } from 'react-hook-form'

interface Props {
  onSubmit: () => void
  cancelRequest?: () => void
  isCancelButton?: boolean
}

const SubmitCancelButton = ({ onSubmit, cancelRequest, isCancelButton }: Props) => {
  const { formState } = useFormContext()
  const { isValid } = formState

  if (isCancelButton) {
    return (
      <Button type="primary" danger onClick={cancelRequest} icon={<LoadingOutlined />}>
        Cancel
      </Button>
    )
  }

  return (
    <Button type="primary" onClick={onSubmit} disabled={!isValid} data-test="submit-customer-filters-cta">
      Submit
    </Button>
  )
}

export default SubmitCancelButton
