import type { FormInstance } from 'antd/lib/form'
import { Form } from 'antd-next'
import JobTitleSelect from 'components/shared/JobTitleSelect'
import { useToggle } from 'react-use'

import { DataRow, Record } from './interfaces'
import { StyledEditableCell } from './StyledEditableCell'

interface Props {
  form: FormInstance<any>
  dataIndex: keyof DataRow
  record: Record
  onSave: () => Promise<void>
}

const UserJobTitleCell = ({ form, dataIndex: key, record, onSave }: Props) => {
  const [editing, toggleEditing] = useToggle(false)
  const currentJobTitle = record?.job_title?.jobTitle

  const toggleEdit = () => {
    toggleEditing()
    form.setFieldsValue({ [key]: currentJobTitle })
  }

  const handleOnChange = async (jobTitle: string | string[]) => {
    form.setFieldsValue({ [key]: jobTitle })
    await onSave()
  }

  if (editing) {
    return (
      <Form.Item style={{ margin: 0 }} name={key}>
        <JobTitleSelect
          value={currentJobTitle}
          jobTitles={record?.job_title?.allJobTitles || []}
          onChange={handleOnChange}
          defaultOpen
        />
      </Form.Item>
    )
  }

  return (
    <StyledEditableCell onClick={toggleEdit} data-test={`user-cell-${key}`}>
      {currentJobTitle}
    </StyledEditableCell>
  )
}

export default UserJobTitleCell
