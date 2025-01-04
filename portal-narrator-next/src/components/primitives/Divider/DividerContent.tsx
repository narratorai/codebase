import clsx from 'clsx'

import { CONTENT_STYLES } from './constants'
import Divider from './Divider'
import { IDividerContent } from './interfaces'

type Props = IDividerContent

const DividerContent = ({ content = 'center', soft = false, ...props }: Props) => (
  <div className="relative">
    <div aria-hidden="true" className="absolute inset-0 flex items-center">
      <Divider soft={soft} />
    </div>
    <div {...props} className={clsx('relative flex items-center', CONTENT_STYLES[content])} />
  </div>
)

export default DividerContent
