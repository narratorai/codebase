import { useParams, usePathname, useRouter, useSearchParams as useNextSearchParams } from 'next/navigation'
import qs from 'qs'

interface ParsedQs {
  [key: string]: undefined | string | string[] | ParsedQs | ParsedQs[] | null
}

function stringifySearchParams(params: null | ParsedQs): string {
  return qs.stringify(params, { arrayFormat: 'repeat', skipNulls: true })
}

/**
 * Hook to get and store data in search params.
 *
 * @example
 *  const [searchParams, setSearchParam] = useSearchParams()
 *  setSearchParam('name', 'John Doe')
 *  console.log(searchParams) // { name: 'John Doe' }
 */
export function useSearchParams(): [
  ParsedQs,
  (name: string, data: ParsedQs[0]) => void,
  (data: Record<string, ParsedQs>) => void,
] {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useNextSearchParams()
  const parsedParams = qs.parse(searchParams?.toString() ?? '')

  const setSearchParam = (name: string, data: ParsedQs[0]) => {
    const params = { ...parsedParams, [name]: data }
    const url = `${pathname}?${stringifySearchParams(params)}`

    router.push(url)
  }

  /** Set multiple search params at once */
  const setSearchParams = (data: Record<string, ParsedQs>) => {
    const params = { ...parsedParams, ...data }
    const url = `${pathname}?${stringifySearchParams(params)}`

    router.push(url)
  }

  return [parsedParams, setSearchParam, setSearchParams]
}

export function useCompanySlugParam() {
  const params = useParams<{ companySlug: string }>()
  if (params === null) {
    throw new Error('Missing company slug')
  }

  return params.companySlug
}
