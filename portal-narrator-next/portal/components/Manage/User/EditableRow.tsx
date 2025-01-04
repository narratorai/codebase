import { Form } from 'antd-next'

import { EditableRowContext } from './EditableCell'

interface Props {
  index: number
}

const EditableRow = ({ index, ...props }: Props) => {
  const [form] = Form.useForm()

  return (
    <Form form={form} component={false}>
      <EditableRowContext.Provider value={form}>
        <tr data-test="company-user-table-row" {...props} />
      </EditableRowContext.Provider>
    </Form>
  )
}

export default EditableRow
