import { isFinite, truncate } from 'lodash'

import { IOptions } from './interfaces'

export const formatShortString = (value: string, options: IOptions): string => {
  const { truncateLimit } = options
  // if a truncate limit was set, truncate the string
  if (isFinite(truncateLimit)) {
    return truncate(value, { length: truncateLimit })
  }
  // otherwise return the string untruncated
  return value
}
