import { CopyOutlined, DeleteOutlined, EyeInvisibleOutlined, EyeOutlined, MoreOutlined } from '@ant-design/icons'
import { Button, Dropdown, Popconfirm } from 'antd-next'
import { colors } from 'util/constants'

interface Props {
  sectionVisibleInAssembled: boolean
  handleToggleShowCondition: () => void
  handleCopySection: () => void
  handleDeleteSection: () => void
  disableDeleteOption: boolean
  showCondition: boolean
  conditioned_on?: string
}

const SectionOptions = ({
  sectionVisibleInAssembled,
  handleToggleShowCondition,
  handleCopySection,
  handleDeleteSection,
  disableDeleteOption,
  showCondition,
  conditioned_on,
}: Props) => {
  const menuItems = [
    {
      key: 'conditional-content',
      onClick: handleToggleShowCondition,
      icon: sectionVisibleInAssembled ? (
        <EyeOutlined style={{ color: showCondition || conditioned_on ? colors.blue500 : 'inherit' }} />
      ) : (
        <EyeInvisibleOutlined style={{ color: colors.red500 }} />
      ),
      label: 'Hide/Show Section',
    },

    {
      key: 'copy-content',
      onClick: handleCopySection,
      icon: <CopyOutlined />,
      label: 'Copy Section',
    },

    {
      key: 'delete-content',
      disabled: disableDeleteOption,
      icon: <DeleteOutlined style={{ color: colors.red500 }} />,
      label: (
        <Popconfirm title={'Delete section?'} onConfirm={handleDeleteSection}>
          <span data-test="section-option-delete">Delete Section</span>
        </Popconfirm>
      ),
    },
  ]

  return (
    <Dropdown menu={{ items: menuItems }}>
      <Button size="small" icon={<MoreOutlined />} />
    </Dropdown>
  )
}

export default SectionOptions
