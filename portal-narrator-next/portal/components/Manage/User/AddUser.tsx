import { PlusOutlined } from '@ant-design/icons'
import { App, Button } from 'antd-next'
import { FormItem, SearchSelect } from 'components/antd/staged'
import { Box, Flex } from 'components/shared/jawns'
import { ICompany_User_Role_Enum } from 'graph/generated'
import { useEffect } from 'react'
import { Controller, FormProvider, useForm, useFormContext } from 'react-hook-form'
import { useLazyCallMavis } from 'util/useCallMavis'

import EmailInput from './EmailInput'
import FirstNameInput from './FirstNameInput'
import LastNameInput from './LastNameInput'

const ROLE_OPTIONS = [
  { label: 'Member', value: ICompany_User_Role_Enum.User },
  { label: 'Admin', value: ICompany_User_Role_Enum.Admin },
]

interface FormData {
  email: string
  first_name?: string
  last_name?: string
  role: ICompany_User_Role_Enum
}

interface Props {
  onSuccess?: () => void
}

const RoleSelect = () => {
  const { control } = useFormContext()

  return (
    <Controller
      control={control}
      name={'role'}
      render={({ field, fieldState: { isTouched: touched, error } }) => (
        <FormItem label="Role" meta={{ touched, error: error?.message }} layout="vertical" compact required>
          <SearchSelect {...field} options={ROLE_OPTIONS} />
        </FormItem>
      )}
    />
  )
}

const SubmitButton = ({ loading }: { loading: boolean }) => {
  const {
    formState: { isValid },
  } = useFormContext()

  return (
    <Button
      data-test="add-user-button"
      loading={loading}
      type="primary"
      icon={<PlusOutlined />}
      htmlType="submit"
      disabled={!isValid || loading}
    >
      Add User
    </Button>
  )
}

const AddUser = ({ onSuccess }: Props) => {
  const { notification } = App.useApp()

  const methods = useForm<FormData>({
    defaultValues: { role: ICompany_User_Role_Enum.User },
    mode: 'all',
  })

  const { handleSubmit, reset } = methods

  // Post to mavis to add the user
  const [addUser, { response: addUserResponse, loading: addUserLoading }] = useLazyCallMavis<FormData>({
    method: 'POST',
    path: '/admin/v1/user/new',
  })

  const handleSubmitUser = handleSubmit((formData: FormData) => {
    addUser({ body: formData })
  })

  // handle add user success
  useEffect(() => {
    if (addUserResponse) {
      notification.success({
        key: 'add-user-success',
        placement: 'topRight',
        message: 'User Successfully Added',
      })

      onSuccess?.()

      // clear user info on success
      reset()
    }
  }, [addUserResponse, onSuccess, reset, notification])

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmitUser}>
        <Box mb={2}>
          <EmailInput />
          <Flex>
            <Box mr={1}>
              <FirstNameInput />
            </Box>
            <Box mr={1}>
              <LastNameInput />
            </Box>
            <RoleSelect />
          </Flex>
        </Box>

        <Flex justifyContent="flex-end">
          <SubmitButton loading={addUserLoading} />
        </Flex>
      </form>
    </FormProvider>
  )
}

export default AddUser
