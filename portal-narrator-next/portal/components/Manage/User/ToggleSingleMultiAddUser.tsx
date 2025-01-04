import { InfoCircleOutlined } from '@ant-design/icons'
import { Switch, Tooltip } from 'antd-next'
import { Box, Flex, Typography } from 'components/shared/jawns'
import useToggle from 'util/useToggle'

import AddMultipleUsers from '../User/AddMultipleUsers'
import AddUser from '../User/AddUser'

interface Props {
  refetch: () => void
}

const ToggleSingleMultiAddUser = ({ refetch }: Props) => {
  const [showSingleAddUser, toggleShowSingleAddUser] = useToggle(true)

  return (
    <Box data-test="add-users-container">
      <Box mb={3}>
        <Switch
          checkedChildren="Single"
          unCheckedChildren="Batch"
          checked={showSingleAddUser}
          onChange={toggleShowSingleAddUser}
        />
      </Box>

      {showSingleAddUser && (
        <Box>
          <Typography type="title400">Add User</Typography>

          <AddUser onSuccess={refetch} />
        </Box>
      )}

      {!showSingleAddUser && (
        <Box>
          <Flex alignItems="center">
            <Typography type="title400" mr={1}>
              Add Multiple Users
            </Typography>

            <Tooltip title="You may add emails individually or by pasting in multiple, comma separated emails. Once created you may update user info and permissions from the users table.">
              <div>
                <InfoCircleOutlined />
              </div>
            </Tooltip>
          </Flex>

          <AddMultipleUsers refetchCompanyUsers={refetch} />
        </Box>
      )}
    </Box>
  )
}

export default ToggleSingleMultiAddUser
