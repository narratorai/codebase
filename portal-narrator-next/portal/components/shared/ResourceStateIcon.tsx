import { DeleteOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd-next'
import { IStatus_Enum } from 'graph/generated'
import Image from 'next/image'
import narratorIcon from 'static/img/logo-black.png'

interface Props {
  state: IStatus_Enum
  size?: 'small' | 'middle' | 'large'
  hideTooltip?: boolean
}

function ResourceStateIcon({ state, size = 'small', hideTooltip = false, ...rest }: Props) {
  const iconSize = { height: 14, width: 14 } // defaults small
  switch (size) {
    case 'middle':
      iconSize['height'] = 20
      iconSize['width'] = 20
      break
    case 'large':
      iconSize['height'] = 26
      iconSize['width'] = 26
  }

  if (state === IStatus_Enum.Live) {
    return (
      <Tooltip title={hideTooltip ? undefined : 'Shared'}>
        <TeamOutlined style={{ fontSize: `${iconSize['width']}px` }} {...rest} />
      </Tooltip>
    )
  }

  if (state === IStatus_Enum.InProgress) {
    return (
      <Tooltip title={hideTooltip ? undefined : 'Private'}>
        <UserOutlined style={{ fontSize: `${iconSize['width']}px` }} {...rest} />
      </Tooltip>
    )
  }

  if (state === IStatus_Enum.Archived) {
    return (
      <Tooltip title={hideTooltip ? undefined : 'Archived'}>
        <DeleteOutlined style={{ fontSize: `${iconSize['width']}px` }} {...rest} />
      </Tooltip>
    )
  }

  if (state === IStatus_Enum.InternalOnly) {
    return (
      <Tooltip title={hideTooltip ? undefined : 'Internal Only'}>
        <Image {...iconSize} src={narratorIcon} alt="Internal Only" {...rest} />
      </Tooltip>
    )
  }

  return null
}

export default ResourceStateIcon
