// Render portal at /login
// - can be navigated to directly or linked to
// - passes query params through directly

import { GetServerSideProps } from 'next'

import { parseQueryValue } from '@/util/nextjs'

export { default } from '@/components/DynamicPortalRoute'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const loginParams = new URLSearchParams()
  const queryParams = ctx.query
  for (const key in queryParams) {
    const val = parseQueryValue(queryParams[key])
    if (val) {
      loginParams.set(key, val)
    }
  }

  return {
    redirect: {
      permanent: false,
      destination: `/api/auth/login?${loginParams.toString()}`,
    },
  }
}
