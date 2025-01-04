import Image from 'next/image'
import MavisIcon from 'static/mavis/icons/logo.svg'

import { useCurrentAuth0User } from '@/util/auth'

interface Props {
  isUser: boolean
}

const ChatMessageUserAvatar = ({ isUser }: Props) => {
  const { name, picture } = useCurrentAuth0User()
  const userName = name || 'User'
  const loader = () => picture || ''

  return (
    <>
      {isUser && (
        <div className="w-9 pb-2">
          <Image alt={userName} className="size-9 rounded-full" height={36} loader={loader} src="/" width={36} />
        </div>
      )}

      {!isUser && (
        <div className="w-9 pb-12">
          <MavisIcon className="size-9 rounded-full p-1 bordered-gray-100" />
        </div>
      )}
    </>
  )
}

export default ChatMessageUserAvatar
