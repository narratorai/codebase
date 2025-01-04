/* eslint-disable no-console */
'use client'

import { useEffect } from 'react'

import Sentry from '@/util/sentry'

interface Props {
  error: { digest?: string } & Error
  reset: () => void
}

const GlobalError = ({ error, reset }: Props) => {
  useEffect(() => {
    Sentry.captureException(error)
    console.error(error)
  })
  return (
    <html lang="en">
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  )
}

export default GlobalError
