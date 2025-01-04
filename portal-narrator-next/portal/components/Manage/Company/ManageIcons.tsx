import {
  ApiOutlined,
  DollarOutlined,
  FileSyncOutlined,
  HddOutlined,
  ProfileOutlined,
  TeamOutlined,
} from '@ant-design/icons'

import { ManagePaths } from './interfaces'

interface Props {
  type: ManagePaths
}

const ManageIcons = ({ type, ...iconProps }: Props) => {
  if (type === 'warehouse') {
    return <HddOutlined {...iconProps} />
  }

  if (type === 'company') {
    return <ProfileOutlined {...iconProps} />
  }

  if (type === 'users') {
    return <TeamOutlined {...iconProps} />
  }

  if (type === 'billing') {
    return <DollarOutlined {...iconProps} />
  }

  if (type === 'branding') {
    return <FileSyncOutlined {...iconProps} />
  }

  if (type === 'connections') {
    return <ApiOutlined {...iconProps} />
  }

  return null
}

export default ManageIcons
