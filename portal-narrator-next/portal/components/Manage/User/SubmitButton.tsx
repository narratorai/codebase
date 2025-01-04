import { PlusOutlined } from '@ant-design/icons'
import { ProtectedRoleButton } from 'components/context/auth/protectedComponents'
import { isArray } from 'lodash'
import { useFormContext } from 'react-hook-form'

interface Props {
  addUsersLoading: boolean
}

const SubmitButton = ({ addUsersLoading }: Props) => {
  const { watch, formState } = useFormContext()
  const { isValid } = formState
  const emailsToAdd = watch('emails') || []

  let buttonText = 'Add Users'
  if (isArray(emailsToAdd) && emailsToAdd.length === 1) buttonText = 'Add User'
  if (isArray(emailsToAdd) && emailsToAdd.length > 1) buttonText = `Add ${emailsToAdd.length} Users`

  return (
    <ProtectedRoleButton
      data-test="add-users-button"
      type="primary"
      htmlType="submit"
      loading={addUsersLoading}
      icon={<PlusOutlined />}
      disabled={!isValid || addUsersLoading}
    >
      {buttonText}
    </ProtectedRoleButton>
  )
}

export default SubmitButton
