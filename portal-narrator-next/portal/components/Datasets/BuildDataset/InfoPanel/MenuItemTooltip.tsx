import { Tooltip } from 'antd-next'

interface Props {
  tooltipTitle: string
  menuItemLabel: string
}

/**
 * Helps whole menu item be hover-able for tooltip
 */
const MenuItemTooltip = ({ tooltipTitle, menuItemLabel }: Props) => {
  return (
    <Tooltip placement="right" title={tooltipTitle}>
      <div style={{ display: 'inline-block', minWidth: 188 }}>{menuItemLabel}</div>
    </Tooltip>
  )
}

export default MenuItemTooltip
