import { forwardRef } from 'react'

import Avatar from './Avatar'
import AvatarDetailsDescription from './AvatarDetailsDescription'
import AvatarDetailsLabel from './AvatarDetailsLabel'
import { IAvatarDetails } from './interfaces'

type Ref = React.ForwardedRef<HTMLSpanElement>

type Props = IAvatarDetails

const AvatarDetails = ({ color = 'indigo', description, label, size = 'sm', ...props }: Props, ref: Ref) => {
  const showDetails = label || description

  return (
    <div className="flex items-center overflow-hidden">
      <div>
        <Avatar {...props} alt={label} color={color} ref={ref} size={size} />
      </div>

      {showDetails && (
        <div className="ml-3">
          {label && <AvatarDetailsLabel color={color} text={label} />}
          {description && <AvatarDetailsDescription color={color} text={description} />}
        </div>
      )}
    </div>
  )
}

export default forwardRef(AvatarDetails)
