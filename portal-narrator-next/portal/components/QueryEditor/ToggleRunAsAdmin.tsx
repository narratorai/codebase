import { Popconfirm, Switch, Tooltip } from 'antd-next'
import { useUser } from 'components/context/user/hooks'
import { useToggle } from 'react-use'
import analytics from 'util/analytics'

interface Props {
  onChange: (value: boolean) => void
}

const ToggleRunAsAdmin = ({ onChange }: Props) => {
  const { isCompanyAdmin } = useUser()
  const [showConfirm, toggleShowConfirm] = useToggle(false)
  const [runAsAdmin, toggleRunAsAdmin] = useToggle(false)

  const handleToggle = () => {
    const nextRunAsAdmin = !runAsAdmin

    toggleRunAsAdmin(nextRunAsAdmin)
    analytics.track('toggled_admin_query_mode', { admin: nextRunAsAdmin })
    onChange(nextRunAsAdmin)
  }

  const handleConfirm = () => {
    handleToggle()
    toggleShowConfirm()
  }

  if (!isCompanyAdmin) {
    return (
      <Tooltip title="Only Narrator admins can run queries with admin privileges">
        <Switch checkedChildren="Admin User Mode" unCheckedChildren="Admin User Mode" disabled />
      </Tooltip>
    )
  }

  return (
    <Popconfirm
      title="Are you sure?"
      description={
        <>
          Admins can modify and delete data in the database.
          <br />
          Note: Row limits are not applied, so make sure to add a LIMIT to all queries.
        </>
      }
      open={showConfirm}
      onCancel={toggleShowConfirm}
      onConfirm={handleConfirm}
      placement="bottom"
    >
      <Switch
        checked={runAsAdmin}
        checkedChildren="Admin User Mode"
        unCheckedChildren="Admin User Mode"
        onChange={() => {
          // don't show confirm if leaving admin mode
          runAsAdmin ? handleToggle() : toggleShowConfirm()
        }}
      />
    </Popconfirm>
  )
}

export default ToggleRunAsAdmin
