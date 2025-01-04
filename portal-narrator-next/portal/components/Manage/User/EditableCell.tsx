import type { FormInstance } from 'antd/lib/form'
import { createContext, useContext } from 'react'

import { DataRow, Record } from './interfaces'
import UserEditableCell from './UserEditableCell'
import UserJobTitleCell from './UserJobTitleCell'
import UserRoleCell from './UserRoleCell'

export const EditableRowContext = createContext<FormInstance<any> | null>(null)

interface Props {
  title: React.ReactNode
  editable: boolean
  children: React.ReactNode
  dataIndex: keyof DataRow
  record: Record
  handleSave: (record: Record) => void
}

const EditableCell = ({ title, editable, children, dataIndex: key, record, handleSave, ...restProps }: Props) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const form = useContext(EditableRowContext)!

  const save = async () => {
    const values = await form.validateFields()

    // overwrite original record's value that was updated
    // (only updating one cell at a time)
    handleSave({
      ...record,
      ...values,
      // TODO: This is an UGLY hack to make the job_title field work since it was
      // designed to be an object with options included. This should be refactored to be consistent
      job_title: { jobTitle: values.job_title },
    })
  }

  let childNode = null

  if (key === 'role') {
    childNode = <UserRoleCell form={form} dataIndex={key} record={record} onSave={save} />
  } else if (key === 'job_title') {
    childNode = <UserJobTitleCell form={form} dataIndex={key} record={record} onSave={save} />
  } else {
    childNode = (
      <UserEditableCell form={form} dataIndex={key} record={record} onSave={save}>
        {children}
      </UserEditableCell>
    )
  }

  return (
    <td data-test="company-user-table-cell" {...restProps}>
      {editable ? childNode : children}
    </td>
  )
}

export default EditableCell
