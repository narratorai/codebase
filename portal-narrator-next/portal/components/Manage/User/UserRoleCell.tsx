import type { FormInstance } from 'antd/lib/form'
import { Form, Popconfirm, Select } from 'antd-next'
import { useUser } from 'components/context/user/hooks'
import { Typography } from 'components/shared/jawns'
import { ICompany_User_Role_Enum } from 'graph/generated'
import { isEqual } from 'lodash'
import { useToggle } from 'react-use'
import usePrevious from 'util/usePrevious'

import { DataRow, Record } from './interfaces'

const { Option } = Select

interface Props {
  form: FormInstance
  dataIndex: keyof DataRow
  record: Record
  onSave: () => void
}

const UserRoleCell = ({ form, dataIndex: key, record, onSave }: Props) => {
  const { isCompanyAdmin } = useUser()
  const [showConfirm, toggleConfirm] = useToggle(false)

  const currentRole = record?.role
  const prevRole = usePrevious(currentRole)

  const handleConfirm = async () => {
    // toggle value (admin <=> user)
    await form.setFieldsValue({
      [key]:
        currentRole === ICompany_User_Role_Enum.Admin ? ICompany_User_Role_Enum.User : ICompany_User_Role_Enum.Admin,
    })

    onSave()
    toggleConfirm()
  }

  if (!isEqual(prevRole, currentRole)) {
    // set role to form any time it updates
    // so when updating other fields (i.e. first_name)
    // the save() function has access to current role
    form.setFieldsValue({ role: currentRole })
  }

  return (
    <Form.Item style={{ margin: 0 }} name={key}>
      <Popconfirm
        title={
          currentRole === ICompany_User_Role_Enum.Admin
            ? "Are you sure you want to remove this user's Admin access?"
            : 'Are you sure you want to make this user an Admin?'
        }
        okText="Yes"
        onConfirm={handleConfirm}
        onCancel={toggleConfirm}
        open={showConfirm}
      >
        <Select
          data-test="user-cell-role-select"
          bordered={false}
          popupMatchSelectWidth={false}
          // non-admin should never see this page but adding extra check here since it is so sensitive
          disabled={!isCompanyAdmin}
          getPopupContainer={(trigger) => trigger.parentNode}
          value={currentRole}
          onSelect={toggleConfirm}
        >
          <Option
            key="member"
            data-test="user-cell-role-option"
            value={ICompany_User_Role_Enum.User}
            label="Member"
            disabled={currentRole === ICompany_User_Role_Enum.User}
          >
            <Typography>Member</Typography>
          </Option>

          <Option
            key="admin"
            data-test="admin-cell-role-option"
            value={ICompany_User_Role_Enum.Admin}
            label="Admin"
            disabled={currentRole === ICompany_User_Role_Enum.Admin}
          >
            <Typography>Admin</Typography>
          </Option>
        </Select>
      </Popconfirm>
    </Form.Item>
  )
}

export default UserRoleCell
