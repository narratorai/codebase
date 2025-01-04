import clsx from 'clsx'

import { HEADING_STYLES } from './constants'
import type { IHeading } from './interfaces'

const Heading = ({ level = 1, ...props }: IHeading) => {
  const Element: `h${typeof level}` = `h${level}`

  return <Element className={clsx('text-zinc-950 dark:text-white', HEADING_STYLES[level])} {...props} />
}

export default Heading
