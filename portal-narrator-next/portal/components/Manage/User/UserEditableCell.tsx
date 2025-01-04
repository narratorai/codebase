import type { FormInstance } from 'antd/lib/form'
import type { InputRef } from 'antd/lib/input'
import { Form, Input } from 'antd-next'
import { useEffect, useRef } from 'react'
import { useToggle } from 'react-use'

import { DataRow, Record } from './interfaces'
import { StyledEditableCell } from './StyledEditableCell'

interface Props {
  form: FormInstance<any>
  dataIndex: keyof DataRow
  record: Record
  children: React.ReactNode
  onSave: () => Promise<void>
}

const UserEditableCell = ({ form, dataIndex: key, record, children, onSave }: Props) => {
  const [editing, toggleEditing] = useToggle(false)
  const inputRef = useRef<InputRef>(null)

  const toggleAndCommitChanges = () => {
    toggleEditing()
    form.setFieldsValue({ [key]: record[key] })
  }

  useEffect(() => {
    // De-select a previous clicked input
    if (editing) inputRef.current?.focus()
  }, [editing])

  if (editing)
    return (
      <Form.Item style={{ margin: 0 }} name={key}>
        <Input
          data-test="user-cell-input"
          ref={inputRef}
          onPressEnter={onSave}
          onBlur={onSave}
          onKeyDown={(e) => {
            if (e.code === 'Escape') toggleAndCommitChanges()
          }}
        />
      </Form.Item>
    )

  return (
    <StyledEditableCell onClick={toggleAndCommitChanges} data-test={`user-cell-${key}`}>
      {children}
    </StyledEditableCell>
  )
}

export default UserEditableCell
