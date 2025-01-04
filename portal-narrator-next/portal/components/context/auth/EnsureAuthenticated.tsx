import { CenteredLoader } from 'components/shared/icons/Loader'
import React from 'react'

import { useAuth0 } from './hooks'

interface Props {
  children: React.ReactNode
}

const EnsureAuthenticated = ({ children }: Props) => {
  const { isAuthenticated } = useAuth0()

  if (!isAuthenticated) {
    // Spinner will show until the auth provider redirects to login
    return <CenteredLoader id="require-auth-loader" />
  }

  return children
}

export default EnsureAuthenticated
