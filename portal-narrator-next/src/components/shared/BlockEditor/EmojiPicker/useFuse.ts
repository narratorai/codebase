import Fuse from 'fuse.js'
import { debounce, isEmpty } from 'lodash'
import { useMemo, useState } from 'react'

/**
 * Hook to use Fuse for searching.
 */
export default function useFuse<T>(items: T[], keys: string[]): [T[], (value: string) => void] {
  const [pattern, setPattern] = useState('')

  const fuse = useMemo(() => new Fuse(items, { keys, threshold: 0.4 }), [items, keys])
  const results = useMemo(
    () => (isEmpty(pattern) ? items : fuse.search(pattern, { limit: 20 }).map((result) => result.item)),
    [items, pattern, fuse]
  )

  const onSearch = debounce((value: string) => {
    setPattern(value)
  }, 500)

  return [results, onSearch]
}
