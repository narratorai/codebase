import { Popconfirm, Spin, Switch } from 'antd-next'
import { Box, Typography } from 'components/shared/jawns'
import { noop } from 'lodash'
import { colors } from 'util/constants'

interface AccessToggleProps {
  checked: boolean
  loading: boolean
  onChange: () => void
}

export const AccessToggle = ({ checked, loading, onChange }: AccessToggleProps) => {
  return (
    <Spin spinning={loading}>
      <Switch
        checked={checked}
        onChange={onChange}
        checkedChildren="Allow Access"
        unCheckedChildren="Disallow Access"
        disabled={loading}
      />
    </Spin>
  )
}

const PopconfirmAccessToggle = ({ checked, loading, onChange }: AccessToggleProps) => {
  return (
    <Popconfirm
      title={
        <Box style={{ maxWidth: '400px' }} mb={2}>
          <Typography type="title400" mb={1}>
            Are you sure you want to restrict Narrator's access to your data?
          </Typography>

          <Typography mb={1}>
            Narrator's support will not be able to see anything in your account, which might make it hard to debug
            issues.
          </Typography>

          <Typography color={colors.gray500}>(You can always re-grant access to Narrator in the future)</Typography>
        </Box>
      }
      onConfirm={onChange}
      okText="Yes"
      cancelText="No"
    >
      {/* allow confirm to handle update request */}
      <Box>
        <AccessToggle checked={checked} loading={loading} onChange={noop} />
      </Box>
    </Popconfirm>
  )
}

export default PopconfirmAccessToggle
