import { Input, Modal } from 'antd-next'
import { FormItem } from 'components/antd/staged'
import { isEmpty } from 'lodash'
import React, { useState } from 'react'

interface Props {
  initialValue: string
  onOk: (name: string) => void
  onClose: () => void
}

const RenameTabModal = ({ initialValue, onOk, onClose }: Props) => {
  const [tabName, setTabName] = useState(initialValue)
  const isValid = !isEmpty(tabName)

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setTabName(name)
  }

  const handleOnOk = () => {
    if (isValid) {
      onOk(tabName)
    }
  }

  return (
    <Modal title="Rename Tab" open onCancel={onClose} onOk={handleOnOk} okButtonProps={{ disabled: !isValid }}>
      <FormItem label="Tab Name" layout="vertical">
        <Input onChange={handleOnChange} value={tabName} />
      </FormItem>
    </Modal>
  )
}

export default RenameTabModal
