import Image, { StaticImageData } from 'next/image'
import { ImgHTMLAttributes } from 'react'
import DataStudioLogo from 'static/img/dataStudioIcon.svg'
import domoLogo from 'static/img/domoLogo.png'
import LookerLogo from 'static/img/lookerIcon.svg'
import MetabaseLogo from 'static/img/metabaseIcon.svg'
import otherBiLogo from 'static/img/otherBiLogo.png'
import PowerBiLogo from 'static/img/powerbiIcon.svg'
import TableauLogo from 'static/img/tableauIcon.svg'
import { BiToolType } from 'util/datasets/v2/integrations/interfaces'

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
  biType?: BiToolType
  small?: boolean
}

const icons = {
  looker: LookerLogo,
  tableau: TableauLogo,
  metabase: MetabaseLogo,
  powerbi: PowerBiLogo,
  datastudio: DataStudioLogo,
  domo: domoLogo,
  otherbi: otherBiLogo,
}

const BiIcons = ({ biType, small = false, ...props }: Props) => {
  if (!biType || !icons[biType]) {
    return null
  }

  if (biType === 'tableau') {
    return <TableauLogo {...props} />
  }

  if (biType === 'looker') {
    return <LookerLogo {...props} />
  }

  if (biType === 'metabase') {
    return <MetabaseLogo {...props} />
  }

  if (biType === 'powerbi') {
    return <PowerBiLogo {...props} />
  }

  if (biType === 'datastudio') {
    return <DataStudioLogo {...props} />
  }

  let width = small ? 32 : props.width || icons[biType]?.width
  width = parseInt(width.toString())
  let height = small ? 32 : props.height || icons[biType]?.height
  height = parseInt(height.toString())

  return (
    <Image
      {...props}
      placeholder={undefined}
      src={icons[biType] as StaticImageData}
      alt={biType}
      width={width}
      height={height}
      data-public
    />
  )
}

export default BiIcons
