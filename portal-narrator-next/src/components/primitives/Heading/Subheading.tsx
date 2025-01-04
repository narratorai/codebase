import clsx from 'clsx'

import { SUBHEADING_STYLES } from './constants'
import type { IHeading } from './interfaces'

const Subheading = ({ level = 2, ...props }: IHeading) => {
  const Element: `h${typeof level}` = `h${level}`

  return <Element {...props} className={clsx('text-zinc-950 dark:text-white', SUBHEADING_STYLES[level])} />
}

export default Subheading
